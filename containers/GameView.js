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
			win: false,
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
				//only top and bottom rows:
				let value = (j===0 || j===(GRID_SIZE-1)) ? this.generateRandomValue() : 0;
				let state = (j===0 || j===(GRID_SIZE-1)) ? 'grey' : 'init';
				let edge = 'none';
				if (j===0) edge = 'top';
				if (j===(GRID_SIZE-1)) edge = 'bottom';
				row[j] = {value:value,state:state,edge:edge,marked:false};
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

	getCurrentCell(currentX,currentY){
		let offsetY = (currentY - BOARD_TOP) / cell_dim;
		let offsetX = currentX / cell_dim;

		let row = Math.round(offsetY);
		let col = Math.round(offsetX);

		return {row:row,col:col}
	}

	isDropLegal(i,k,x,y,values){
	
		//this function assumes that we check the whole tile was placed on the board
		//before calling it

		let currentCell = this.getCurrentCell(x,y);
		let currentRow = currentCell.row;
		let currentCol = currentCell.col;
		let tiles = this.state.tiles;

		let orientation = tiles[k].orientation;

		//top or left:
		let row = currentRow;
		let col = currentCol;
		let value = values.topLeft;
		if (!this.matchTileBoard(row,col,value)) return false;
		if (!this.matchAdjacent(row,col,value,orientation % 2)) return false;

		//bottom or right:
		row = (orientation % 2 === 0) ? currentRow + 1 : currentRow;
		col = (orientation % 2 === 0) ? currentCol : currentCol + 1;
		value = values.bottomRight;
		//if we checked top, now check bottom, left then right
		let negativeOrientation = (orientation % 2) + 2;
		if (!this.matchTileBoard(row,col,value)) return false;
		if (!this.matchAdjacent(row,col,value,negativeOrientation)) return false;

		//all checks passed, tile can be placed
		return true;

	}

	matchAdjacent(cell_row,cell_col,value,direction){
		
		let cellToTheNorth = 	{row:cell_row - 1, 	col:cell_col};
		let cellToTheEast = 	{row:cell_row, 		col:cell_col + 1};
		let cellToTheSouth = 	{row:cell_row + 1, 	col:cell_col};
		let cellToTheWest =		{row:cell_row, 		col:cell_col - 1};

		let cellsToCheck = [];

		switch(direction){
			//check north
			case 0:
				cellsToCheck.push(cellToTheWest);
				cellsToCheck.push(cellToTheNorth);
				cellsToCheck.push(cellToTheEast);
				break;
			//check west
			case 1:
				cellsToCheck.push(cellToTheSouth);
				cellsToCheck.push(cellToTheNorth);
				cellsToCheck.push(cellToTheWest);
				break;
			//check south
			case 2:
				cellsToCheck.push(cellToTheWest);
				cellsToCheck.push(cellToTheSouth);
				cellsToCheck.push(cellToTheEast);
				break;
			//check east
			case 3:
				cellsToCheck.push(cellToTheEast);
				cellsToCheck.push(cellToTheNorth);
				cellsToCheck.push(cellToTheSouth);
				break;
		}
		
		for (let i=0;i<cellsToCheck.length;i++){
			if (this.matchTileBoard(cellsToCheck[i].row,cellsToCheck[i].col,value) === false) return false;
		}
		
		return true;
		
	}

	matchTileBoard(cell_row,cell_col,value){
		let board = this.state.board;
		let adjacentCell = (cell_row >= 0 && cell_col >= 0 && cell_row < GRID_SIZE && cell_col < GRID_SIZE) ? board[cell_col][cell_row] : null;
		let adjacentValue = (adjacentCell && adjacentCell.state==='domino') ? adjacentCell.value : -1;
		let response = (adjacentValue <= 0 || adjacentValue === value);
		//if (!response) console.log("check failed for row/col/value/boardValue: ",cell_row,cell_col,value,adjacentValue);
		return response;
	}
	
	//i = index of tile in the tile board (0<=index<INITIAL_TILES)
	//k = key of tile in tiles array (0<=key<this.state.tiles.length)
	//x = x location of tile when gesture ended
	//y = y location of tile when gesture ended
	updateTiles=(i,k,x,y)=>{
		
		let currentCell = this.getCurrentCell(x,y);
		let currentRow = currentCell.row;
		let currentCol = currentCell.col;
		let board = this.state.board;
		let tiles = this.state.tiles;
		let tile = tiles[k];

		let orientation = tiles[k].orientation;

		//handle rotation
		switch(orientation){
			case 0:
				//top:top, bottom:bottom
				var values = {topLeft:tile.topValue,bottomRight:tile.bottomValue};
				break;
			case 1:
				//left:bottom, right:top
				var values = {topLeft:tile.bottomValue,bottomRight:tile.topValue};
				break;
			case 2:
				//top:bottom, bottom:top
				var values = {topLeft:tile.bottomValue,bottomRight:tile.topValue};
				break;
			case 3:
				//left:top, right:bottom
				var values = {topLeft:tile.topValue,bottomRight:tile.bottomValue};
				break;
		}

		//will return true iff domino can be legaly placed in grid
		let legal = this.isDropLegal(i,k,x,y,values);

		if (legal){
			//update board
			switch(tile.orientation % 2){
				//north-south
				case 0:
					var topLeftBoardCell = board[currentCell.col][currentCell.row];
					var bottomRightBoardCell = board[currentCell.col][currentCell.row+1];
					break;
				case 1:
				//west-east
					var topLeftBoardCell = board[currentCell.col][currentCell.row];
					var bottomRightBoardCell = board[currentCell.col+1][currentCell.row];
					break;
			}
			// console.log("ruling is ok:",topLeftBoardCell.value,values.topLeft,bottomRightBoardCell.value,values.bottomRight);
			
			topLeftBoardCell.state="domino";
			topLeftBoardCell.value=values.topLeft;
			bottomRightBoardCell.state="domino";
			bottomRightBoardCell.value=values.bottomRight;
			//update tiles
			tile.isDraggable = false;
			tile.top = y;
			tile.left = x;

			//add another tile
			let tileCount = tiles.length;
			tiles.push(this.addTile(i,tileCount));

			//store changes
			this.storeData(board,tiles);
			this.setState({board:board,currentInd:i,currentX:x,currentY:y,tiles:tiles});
			this.renderTiles();
			
			this.checkWin();
			// console.log("win:",win);

		}else{
			// console.log("ruling error:",topLeftBoardCell.value,values.topLeft,bottomRightBoardCell.value,values.bottomRight);
		}
			
		
		return legal;
	}

	clearMarked(win){
		let board = this.state.board;
		for (i=0;i<GRID_SIZE;i++){
			for (j=0;j<GRID_SIZE;j++){
				if (board[i][j].marked && win){
					board[i][j].state = 'init';
					board[i][j].value = 0;
				}
				board[i][j].marked = false;
			}
		}
		this.setState({board:board});
		//if win, need to store date
		if (win) this.storeData(board,null);
	}

	checkWin(){
		//search the grid (as a tree) going from top to bottom and left to right
		//for a connection from one edge to the other
		let board = this.state.board;
		let i = 0;
		let win = false;
		while (win === false && i < GRID_SIZE){
			let initCell = board[i][0]; //top row
			if (initCell.state === 'domino'){
				let initBottom = board[i][1];
				initCell.marked = true;
				this.setState({board:board});
				win = this.checkWinStep(i,1);
				//console.log("worked?",this.state.board[i][0].marked);
			}
			this.clearMarked(win);
			i = i + 1;
		}
		return win;
	}

	checkWinStep(cell_col,cell_row){
		if (cell_col < 0 || cell_col >= GRID_SIZE) return false;
		if (cell_row < 0 || cell_row >= GRID_SIZE) return false;

		let board = this.state.board;
		let currentCell = board[cell_col][cell_row];
		
		//if no tile in cell, break
		if (currentCell.state !== 'domino') return false;
		
		//if already visited, break
		if (currentCell.marked) return false;

		//now mark as visited
		currentCell.marked=true;
		this.setState({board:board});

		if (currentCell.edge === 'bottom'){
			//win condition
			return true;
		}else if (currentCell.state === 'domino'){
			//continue another step in all directions
			return (this.checkWinStep(cell_col+1,cell_row)
				|| this.checkWinStep(cell_col,cell_row+1)
				|| this.checkWinStep(cell_col-1,cell_row)
				|| this.checkWinStep(cell_col,cell_row-1)
				);
		}else{
			//dead end
			return false;
		}
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
					topValue={this.state.tiles[i].topValue}
					bottomValue={this.state.tiles[i].bottomValue}
					onPress={()=>{this.flipTile(this.state.tiles[i].key)}}
					orientation={this.state.tiles[i].orientation}
				/>
			);

		}
	
		return (
			<View style={{width:'100%',height:cell_dim*3}}>
				{renderedTiles}
			</View>
		);
	}

	flipTile(key){
		let tiles = this.state.tiles;
		tiles[key].orientation = (tiles[key].orientation + 1) % 4;
		this.storeData(null,tiles);
		this.setState({tiles:tiles});
	}

	async storeData(board,tiles){
		let response = null;
		if (board && tiles){
			response = await AsyncStorage.multiSet(
				[['@thirtysix:board',JSON.stringify(board)],
				['@thirtysix:tiles',JSON.stringify(tiles)]]
			);
		}else if (board){
			response = await AsyncStorage.setItem('@thirtysix:board',JSON.stringify(board));
		}else if (tiles){
			response = await AsyncStorage.setItem('@thirtysix:tiles',JSON.stringify(tiles));
		}else{
			console.log("store error");
		}
		return response;
	}

	addTile(index,key){
		let randomtopValue = this.generateRandomValue();
		let randombottomValue = this.generateRandomValue();

		let tile={
			isDraggable:true,
			top:TILES_TOP,
			left:10 + (cell_dim*2+5)*index,
			topValue:randomtopValue,
			bottomValue:randombottomValue,
			key:key,
			index:index,
			orientation:0,
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
						<Button title="RESET" onPress={()=>{this.resetBoard()}} />
					</View>
				</View>
			);
		}else{
			return(<View style={styles.container} ><StatusBar hidden={true} /></View>);
		}
	}


}