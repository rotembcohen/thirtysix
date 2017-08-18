import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableHighlight,
  Animated,
  PanResponder,
} from 'react-native';

import {styles} from '../Styles';

export default class Tile extends Component {
	constructor(props){
		super(props);
		this.pressHandler = this.pressHandler.bind(this);
		this.state = {
			pan: new Animated.ValueXY(),
		}
		this.panResponder = PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderMove: Animated.event([null,{
				dx: this.state.pan.x,
				dy: this.state.pan.y,
			}]),
			onPanResponderRelease: (e, gesture) => {
				if(this.isInDropZone(gesture)){
					console.log("gesture x,y:",JSON.stringify(this.state.pan));
				} else {
					Animated.spring(
						this.state.pan,
						{toValue:{x:0,y:0}}
					).start();
				}
			},
		});
	}
	
	isInDropZone(gesture){
		var dz = this.props.dropZoneValues;
		return gesture.moveY > dz.y && gesture.moveY < dz.y + dz.height;
	}

	pressHandler() {
		this.props.pressHandler(this.props.name);
	}
	render() {
		return (
			<View>
				<Animated.View
					{...this.panResponder.panHandlers}
					style = {[this.state.pan.getLayout(),styles.tile]}>
					<Text style={styles.tiletext}> {this.props.name} </Text>
				</Animated.View>
			</View>
		);
	}
}