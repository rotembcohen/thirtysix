import React, { Component } from 'react';
import { View, Text, Dimensions, AsyncStorage, StatusBar } from 'react-native';

import {styles, GRID_SIZE} from '../Styles';
import Draggable from '../components/Draggable';
import Board from '../components/Board';

export default class GameView extends Component {

	static navigationOptions = {
		title: 'thirtysix v0.1'
	}

	constructor(props){
		super(props);
		var board = [];
		for (let i=0; i < GRID_SIZE; i++){
			var row = []
			for (let j=0; j < GRID_SIZE; j++){
				row[j] = {value:0,state:'init'};
			}
			board[i] = row;
		}
		this.state = {
			board: board,
			currentInd: null,
			currentX: null,
			currentY: null,
		}
	}

	async componentWillMount(){
		//gets the board if it is saved in memory
		//otherwise, creates a new one
		var board = null;
		
		let boardJson = await AsyncStorage.getItem('@thirtysix:board');

		if (boardJson === null){
			board = await this.resetBoard()
		}else{
			board = JSON.parse(boardJson);
		}
		if (board.length !== GRID_SIZE) board = await this.resetBoard();
		
		this.setState({board:board});
	}

	async resetBoard(){
		board = this.createBoardValues();
		await AsyncStorage.setItem('@thirtysix:board',JSON.stringify(board));
		return board;
	}

	createBoardValues(){
		var board = [];
		for (let i=0; i < GRID_SIZE; i++){
			var row = [];
			for(let j=0; j < GRID_SIZE; j++){
				let value = (i===0 || j===0 || i===(GRID_SIZE-1) || j===(GRID_SIZE-1)) ? Math.floor(Math.random() * 6) + 1 : 0;
				let state = (i===0 || j===0 || i===(GRID_SIZE-1) || j===(GRID_SIZE-1)) ? 'grey' : 'init';
				row[j] = {value:value,state:state};
			}
			board[i] = row;
		}
		return board;
	}

	updateCurrentMovingTileValues = (i,x,y)=>this.setState({currentInd:i,currentX:x,currentY:y});

	render() {
		
		return (
			<View style={styles.container}>
				<StatusBar hidden={true} />
				<View>
					<Board data={this.state.board} ref="board" />
					<View style={{borderWidth:1,width:100,height:20}}>
						<Text>Grid size:{GRID_SIZE}</Text>
					</View>
				</View>
				<Draggable 
					left={50} top={50} index={0}
					onChange={this.updateCurrentMovingTileValues} 
				/>
				<Draggable
					left={150} top={50} index={1}
					onChange={this.updateCurrentMovingTileValues} 
				/>
				<Draggable
					left={250} top={50} index={2}
					onChange={this.updateCurrentMovingTileValues} 
				/>
				<View>
					<Text>Values for {this.state.currentInd}:</Text>
					<Text>{Math.round(this.state.currentX)},{Math.round(this.state.currentY)}</Text>
				</View>
			</View>
		);
	}


}