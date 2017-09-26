import React, { Component } from 'react';
import { View, Text, Dimensions, AsyncStorage, StatusBar,Button } from 'react-native';

import {styles,GRID_SIZE,cell_dim,BOARD_TOP,TILES_TOP,INITIAL_TILES} from '../Styles';
import Draggable from '../components/Draggable';
import Board from '../components/Board';

export default class GameView extends Component {

	static navigationOptions = {
		title: 'thirtysix v0.1'
	}

	constructor(props){
		super(props);
		this.state = {
			board: [],
			tiles: [],
			currentInd: null,
			currentX: null,
			currentY: null,
			boardLoaded:false,
		}
	}

	async componentWillMount(){
		//gets the board if it is saved in memory
		//otherwise, creates a new one
		var board = null;
		var tiles = null;
		
		let data = await AsyncStorage.multiGet(['@thirtysix:board','@thirtysix:tiles']);
		let boardJson = data[0][1];
		let tilesJson = data[1][1];

		if (boardJson === null || tilesJson === null){
			let response = await this.createBoard();
			board = response['board'];
			tiles = response['tiles'];
		}else{
			board = JSON.parse(boardJson);
			tiles = JSON.parse(tilesJson);
		}
		if (board.length !== GRID_SIZE){
			let response = await this.createBoard();
			board = response['board'];
			tiles = response['tiles'];
		}

		this.setState({
			board:board,
			tiles:tiles,
			boardLoaded:true,
		});
	}

	async createBoard(){
		board = this.createBoardValues();
		tiles = this.createTiles();
		await AsyncStorage.multiSet(
			[['@thirtysix:board',JSON.stringify(board)],
			['@thirtysix:tiles',JSON.stringify(tiles)]]
		);
		return {board:board,tiles:tiles};
	}

	createBoardValues(){
		var board = [];
		for (let i=0; i < GRID_SIZE; i++){
			var row = [];
			for(let j=0; j < GRID_SIZE; j++){
				let value = (i===0 || j===0 || i===(GRID_SIZE-1) || j===(GRID_SIZE-1)) ? this.generateRandomValue() : 0;
				let state = (i===0 || j===0 || i===(GRID_SIZE-1) || j===(GRID_SIZE-1)) ? 'grey' : 'init';
				row[j] = {value:value,state:state};
			}
			board[i] = row;
		}
		return board;
	}

	generateRandomValue(){
		return Math.floor(Math.random() * 6) + 1;
	}

	createTiles(){
		var tiles = [];
		for (let i=0;i<INITIAL_TILES;i++){
			//generate tile domino values
			let randomValueTop = this.generateRandomValue();
			let randomValueBottom = this.generateRandomValue();

			tiles[i]={
				isDraggable:true,
				top:TILES_TOP,
				left:10 + (cell_dim+5)*i,
				valueTop:randomValueTop,
				valueBottom:randomValueBottom,
			}
		}
		return tiles;
	}

	getCurrentCell(){
		let row = Math.round(this.state.currentX / cell_dim);
		let col = Math.round((Number(this.state.currentY) - BOARD_TOP) / cell_dim);

		return row +','+ col;
	}

	updateTiles=(i,x,y)=>{
		let currentRow = Math.round((y - BOARD_TOP) / cell_dim);
		let currentCol = Math.round(x / cell_dim);
		let currentBoard = this.state.board;
		let tiles = this.state.tiles;

		let topCell = currentBoard[currentCol][currentRow];
		let bottomCell = currentBoard[currentCol][currentRow+1];
		let topValue = topCell.value;
		let bottomValue = bottomCell.value;
		
		//will return true iff domino can be legaly placed in grid
		let legal = false;

		//check if board and tile's values match
		if (
			(topValue === 0 || topValue === tiles[i]['valueTop'])
				&&
			(bottomValue === 0 || bottomValue === tiles[i]['valueBottom'])
			){
			// console.log("ruling is ok:",topValue,tiles[i]['valueTop'],bottomValue,tiles[i]['valueBottom']);
			//update board
			topCell.state="domino";
			topCell.value=tiles[i]['valueTop'];
			bottomCell.state="domino";
			bottomCell.value=tiles[i]['valueBottom'];
			//update tiles
			tiles[i].isDraggable = false;
			tiles[i].top = y;
			tiles[i].left = x;
			legal = true;
		}else{
			// console.log("ruling error:",topValue,tiles[i]['valueTop'],bottomValue,tiles[i]['valueBottom']);
		}
			
		
		AsyncStorage.setItem('@thirtysix:tiles',JSON.stringify(tiles));
		//TODO: should happen only if move was legal?
		this.setState({board:currentBoard,currentInd:i,currentX:x,currentY:y,tiles:tiles});
		return legal;
	}

	async resetBoard(){
		this.setState({boardLoaded:false});
		let response = await this.createBoard();
		board = response['board'];
		tiles = response['tiles'];
		
		this.setState({
			board:board,
			tiles:tiles,
			boardLoaded:true,
		});
	}

	renderTiles(){
		let renderedTiles = [];	
		for (let i=0; i < INITIAL_TILES; i++){

			//create tile
			renderedTiles.push(
				<Draggable 
					left={this.state.tiles[i].left}
					top={this.state.tiles[i].top}
					index={i} key={i}
					onChange={this.updateTiles}
					isDraggable={this.state.tiles[i].isDraggable}
					valueTop={this.state.tiles[i].valueTop}
					valueBottom={this.state.tiles[i].valueBottom}
				/>
			);
		}
	
		return (
			<View style={{width:'100%',height:cell_dim*3}}>
				{renderedTiles}
			</View>
		);
	}

	render() {
		if(this.state.boardLoaded){
			return (
				<View style={styles.container}>
					<StatusBar hidden={true} />
					<Board data={this.state.board} />
					{this.renderTiles()}
					<View>
						<Text>Grid size:{GRID_SIZE}</Text>
						<Text>Values for {this.state.currentInd}:</Text>
						<Text>{Math.round(this.state.currentX)},{Math.round(this.state.currentY)}</Text>
						<Text>Current Cell: {this.getCurrentCell()}</Text>
						<Button title="RESET" onPress={()=>{this.resetBoard()}} />
					</View>
				</View>
			);
		}else{
			return(<View style={styles.container} ><StatusBar hidden={true} /></View>);
		}
	}


}