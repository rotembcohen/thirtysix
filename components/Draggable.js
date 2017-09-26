import React, { Component } from 'react'
import { StyleSheet, View, Text, PanResponder } from 'react-native'

import {cell_dim,BOARD_TOP,BOARD_LEFT,GRID_SIZE,MIDDLE_MARGIN} from '../Styles';

export default class Draggable extends Component {

  constructor (props){
    super(props);
    this.state = {
      dragging: false,
      initialTop: props.top,
      initialLeft: props.left,
      offsetTop: 0,
      offsetLeft: 0,
    }
  }
  
  panResponder = {}

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd,
    })
  }

  render() {
    const {dragging, initialTop, initialLeft, offsetTop, offsetLeft} = this.state

    // Update style with the state of the drag thus far
    const style = {
      backgroundColor: dragging ? 'rgba(125,125,125,0.3)' : 'rgba(0,0,0,0)',
      top: initialTop + offsetTop,
      left: initialLeft + offsetLeft,
    }

    return (
      
        <View
          // Put all panHandlers into the View's props
          {...this.panResponder.panHandlers}
          style={[styles.square, style]}
        >
          <Text style={styles.text}>
            top:{Math.round(this.state.initialTop)} {"\n"}
            left:{Math.round(this.state.initialLeft)}
          </Text>
        </View>
      
    )
  }

  // Should we become active when the user presses down on the square?
  handleStartShouldSetPanResponder = () => {
    return this.props.isDraggable;
  }

  // We were granted responder status! Let's update the UI
  handlePanResponderGrant = () => {
    this.setState({dragging: true})
  }

  // Every time the touch/mouse moves
  handlePanResponderMove = (e, gestureState) => {

    // Keep track of how far we've moved in total (dx and dy)
    this.setState({
      offsetTop: gestureState.dy,
      offsetLeft: gestureState.dx,
    })
  }

  // When the touch/mouse is released
  handlePanResponderEnd = (e, gestureState) => {
    const {initialTop, initialLeft} = this.state;

    let newLeft = initialLeft + gestureState.dx;
    let newTop = initialTop + gestureState.dy;
    
    //place tile in the correct placement in cell ("snap into place")
    let response = this.getCurrentCell(newLeft,newTop);
    if (response['insideBoard'] && !response['isInTheMiddle']){
      newTop = response['col']*cell_dim + BOARD_TOP;
      newLeft = response['row']*cell_dim + BOARD_LEFT;
    }else{
      newTop = initialTop;
      newLeft = initialLeft;
    }
    
    // The drag is finished. Set the initialTop and initialLeft so that
    // the new position sticks. Reset offsetTop and offsetLeft for the next drag.
    this.setState({
      dragging: false,
      initialTop: newTop,
      initialLeft: newLeft,
      offsetTop: 0,
      offsetLeft: 0,
    });
    let onChange = this.props.onChange;
    onChange(this.props.index,newLeft,newTop);
  }

  getCurrentCell(currentX,currentY){
    let offsetX = currentX / cell_dim;
    let offsetY = (currentY - BOARD_TOP) / cell_dim;
    let row = Math.round(offsetX);
    let col = Math.round(offsetY);
    //tile landed inside board?
    let insideBoard = (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE);

    let isInTheMiddle = (this.isInTheMiddle(offsetX,row) || this.isInTheMiddle(offsetY,col));

    return {row:row,col:col,insideBoard:insideBoard,isInTheMiddle:isInTheMiddle}
  }

  //helps to make sure tile didn't land in the middle between two cells
  //and therefore not clear where it should land exactly
  isInTheMiddle(precise,rounded){
    let abs_diff = Math.abs(precise - rounded);
    return abs_diff > MIDDLE_MARGIN && abs_diff < (1 - MIDDLE_MARGIN);
  }

}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  square: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: cell_dim,
    height: cell_dim * 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:1,
    borderColor:'blue',
  },
  text: {
    color: 'black',
    fontSize: 12,
  }
})
