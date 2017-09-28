import React, { Component } from 'react'
import { StyleSheet, View, Text, PanResponder, TouchableOpacity } from 'react-native'

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

    if (this.props.isDraggable){
      var borderWidth = 1;
      //rotation handling
      //by clockwise rotation -> points N, then E, S, W and N again
      switch(this.props.orientation){
        case 0:
          var tileText = "T:" + this.props.topValue + "\nB:" + this.props.bottomValue;
          break;
        case 1:
          var tileText = "L:" + this.props.bottomValue + "  R:" + this.props.topValue;
          break;
        case 2:
          var tileText = "T:" + this.props.bottomValue + "\nB:" + this.props.topValue;
          break;
        case 3:
          var tileText = "L:" + this.props.topValue + "  R:" + this.props.bottomValue;
          break;
      }
    }else{
    
      var tileText = '';
      var borderWidth = 0;

    }

    // Update style with the state of the drag thus far
    const style = {
      backgroundColor: dragging ? 'rgba(125,125,125,0.3)' : 'rgba(0,0,0,0)',
      top: initialTop + offsetTop,
      left: initialLeft + offsetLeft,
      width: (this.props.orientation % 2 === 0) ? cell_dim : cell_dim * 2,
      height: (this.props.orientation % 2 === 0) ? cell_dim * 2 : cell_dim, 
      borderWidth: borderWidth,
    }

    return (
      
        <View
          // Put all panHandlers into the View's props
          {...this.panResponder.panHandlers}
          style={[styles.square, style]}
        >
          <TouchableOpacity onPress={this.props.onPress}>
            <Text style={styles.text}>
              {tileText}
            </Text>
          </TouchableOpacity>
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
    let shouldMove = false;
    
    //place tile in the correct placement in cell ("snap into place")
    let response = this.getCurrentCell(newLeft,newTop);
    if (response['insideBoard'] && !response['isInTheMiddle']){
      newTop = response['row']*cell_dim + BOARD_TOP;
      newLeft = response['col']*cell_dim + BOARD_LEFT;
      let onChange = this.props.onChange;
      shouldMove = onChange(this.props.index,this.props.id,newLeft,newTop);
      // console.log("shouldMove:",shouldMove);
    }
    
    //move is not legal,reset tile placement
    if (!shouldMove){
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
  }

  getCurrentCell(currentX,currentY){
    let offsetY = (currentY - BOARD_TOP) / cell_dim;
    let offsetX = currentX / cell_dim;
    
    let row = Math.round(offsetY);
    let col = Math.round(offsetX);

    let orientation = this.props.orientation;

    //tile landed inside board?
    if (orientation % 2 === 0){
      //north-south
      var insideBoard = (row >= 0 && row < (GRID_SIZE-1) && col >= 0 && col < GRID_SIZE);
    }else{
      //west-east
      var insideBoard = (row >= 0 && row < GRID_SIZE && col >= 0 && col < (GRID_SIZE-1));
    }

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
