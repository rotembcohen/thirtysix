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
		//TODO: check errors
		this.storeData(board,tiles);
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
		//when board is reset
		var tiles = [];
		for (let i=0;i<INITIAL_TILES;i++){
			tiles[i]=this.addTile(i,i);
		}
		return tiles;
	}

	getCurrentCell(){
		let row = Math.round(this.state.currentX / cell_dim);
		let col = Math.round((Number(this.state.currentY) - BOARD_TOP) / cell_dim);

		return row +','+ col;
	}

	updateTiles=(i,k,x,y)=>{
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
		//this function assumes that we check the whole tile was placed on the board
		//before calling it
		if (
			(topValue === 0 || topValue === tiles[k]['valueTop'])
				&&
			(bottomValue === 0 || bottomValue === tiles[k]['valueBottom'])
			){
			// console.log("ruling is ok:",topValue,tiles[i]['valueTop'],bottomValue,tiles[i]['valueBottom']);
			//update board
			topCell.state="domino";
			topCell.value=tiles[k]['valueTop'];
			bottomCell.state="domino";
			bottomCell.value=tiles[k]['valueBottom'];
			//update tiles
			tiles[k].isDraggable = false;
			tiles[k].top = y;
			tiles[k].left = x;

			//add another tile
			let tileCount = tiles.length;
			tiles.push(this.addTile(i,tileCount));
			legal = true;
		}else{
			// console.log("ruling error:",topValue,tiles[k]['valueTop'],bottomValue,tiles[k]['valueBottom']);
		}
			
		//TODO: check errors
		this.storeData(currentBoard,tiles);
		
		//TODO: should happen only if move was legal?
		this.setState({board:currentBoard,currentInd:i,currentX:x,currentY:y,tiles:tiles});
		this.renderTiles();
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

		for (let i=0; i < this.state.tiles.length; i++){

			//create tile
			renderedTiles.push(
				<Draggable 
					left={this.state.tiles[i].left}
					top={this.state.tiles[i].top}
					index={this.state.tiles[i].index}
					key={this.state.tiles[i].key}
					id={this.state.tiles[i].key}
					onChange={this.updateTiles}
					isDraggable={this.state.tiles[i].isDraggable}
					valueTop={this.state.tiles[i].valueTop}
					valueBottom={this.state.tiles[i].valueBottom}
				/>
			)
		}
	
		return (
			<View style={{width:'100%',height:cell_dim*3}}>
				{renderedTiles}
			</View>
		);
	}

	async storeData(board,tiles){
		const response = await AsyncStorage.multiSet(
			[['@thirtysix:board',JSON.stringify(board)],
			['@thirtysix:tiles',JSON.stringify(tiles)]]
		);
		return response;
	}

	addTile(index,key){
		let randomValueTop = this.generateRandomValue();
		let randomValueBottom = this.generateRandomValue();

		let tile={
			isDraggable:true,
			top:TILES_TOP,
			left:10 + (cell_dim+5)*index,
			valueTop:randomValueTop,
			valueBottom:randomValueBottom,
			key:key,
			index:index
		};

		return tile;

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