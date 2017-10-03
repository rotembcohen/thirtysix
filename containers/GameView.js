import React, { Component } from 'react';
import { View, Text, Dimensions, AsyncStorage, StatusBar,Button } from 'react-native';

import {styles,GRID_SIZE,cell_dim,BOARD_TOP,TILES_TOP,INITIAL_TILES} from '../Styles';
import Draggable from '../components/Draggable';
import Board from '../components/Board';

win = false;

export default class GameView extends Component {

	/****************************************
	          COMPONENT INIT
	****************************************/
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
			score: null,
			bestScore: null,
		}
	}

	async componentWillMount(){
		//gets the board if it is saved in memory
		//otherwise, creates a new one
		var board = null;
		var tiles = null;
		
		let data = await AsyncStorage.multiGet([
			'@thirtysix:board',
			'@thirtysix:tiles',
			'@thirtysix:currentScore',
			'@thirtysix:bestScore'
			]);
		let boardJson = data[0][1];
		let tilesJson = data[1][1];
		let currentScore = (data[2][1]) ? (Number(data[2][1])) : 0;
		let bestScore = (data[3][1]) ? (Number(data[3][1])) : 0;

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
			score: currentScore,
			bestScore: bestScore,
		});
	}

	/****************************************
	          BOARD CREATION
	****************************************/

	async createBoard(){
		board = this.createBoardValues();
		tiles = this.createTiles();
		//TODO: check errors
		this.storeData({board:board,tiles:tiles,score:0});
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
				//value - domino value (1-6)
				//state - init - empty, grey - special, domino - has tile
				//marked - to be use when determining win and other temp stuff
				//possible - for helper cells
				let possible = (j===0 || j===(GRID_SIZE-1)) ? value : null;
				row[j] = {value:value,state:state,edge:edge,marked:false,possible:possible,row:j,col:i};
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

	async resetBoard(){
		let bestScore = this.state.bestScore;
		let currentScore = this.state.score;
		if (currentScore > bestScore){
			let resp = await AsyncStorage.setItem('@thirtysix:bestScore',currentScore.toString());
			bestScore = currentScore;
		}
		this.setState({boardLoaded:false});
		let response = await this.createBoard();
		board = response['board'];
		tiles = response['tiles'];
		
		this.setState({
			board:board,
			tiles:tiles,
			boardLoaded:true,
			bestScore:bestScore,
			score:0,
		});
	}

	/****************************************
	          CHECKING DOMINO DROP
	****************************************/

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

			//update score:
			let score = this.state.score + values.topLeft + values.bottomRight;
			
			this.setState({board:board,currentInd:i,currentX:x,currentY:y,tiles:tiles,score:score});
			
			this.renderTiles();
			
			this.checkWin();
			
			if (!win){
				//mark adjacent cells with the possible connecting options
				this.generateHelperCells(topLeftBoardCell);
				this.generateHelperCells(bottomRightBoardCell);
			}
			
			//store changes
			this.storeData({board:board,tiles:tiles,score:score});

			//reset win
			win = false;

		}else{
			// console.log("ruling error:",topLeftBoardCell.value,values.topLeft,bottomRightBoardCell.value,values.bottomRight);
		}
			
		
		return legal;
	}

	/****************************************
	          HELPER CELLS
	****************************************/

	generateHelperCells(originalCell){
		let cell_row = originalCell.row;
		let cell_col = originalCell.col;
		let value = originalCell.value;

		this.generateHelper(cell_row-1,cell_col,value);
		this.generateHelper(cell_row,cell_col-1,value);
		this.generateHelper(cell_row,cell_col+1,value);
		this.generateHelper(cell_row+1,cell_col,value);

	}

	generateHelper(row,col,value){
		if (row < 0 || row >= GRID_SIZE) return;
		if (col < 0 || col >= GRID_SIZE) return;

		let board = this.state.board;
		let cell = board[col][row];

		//can't be helper - already has domino value
		if (cell.state === 'domino') return;

		//already marked as no possible options
		if (cell.possible === -1) return;

		//already marked as current value
		if (cell.possible === value) return;

		//has different value - mark as impossible
		if (cell.possible) {
			cell.possible = -1;
		}else{
			//else - mark only possible option as value
			cell.possible = (value) ? value : null;
		}
		this.setState({board:board});
	

	}

	refreshHelperCells(){
		let board = this.state.board;
		//will store all remaining domino cells
		let dominoCells = [];
		//reset to default values
		for (let i=0;i<GRID_SIZE;i++){
			for (let j=0;j<GRID_SIZE;j++){
				let cell = board[j][i];
				if (cell.state === 'init') cell.possible = null;
				if (cell.state === 'grey') cell.possible = cell.value;
				if (cell.state === 'domino') {
					dominoCells.push(cell);
				}
			}
		}

		//refresh possibles for adjacent cells of each domino cell
		for (let k=0;k<dominoCells.length;k++){
			this.generateHelperCells(dominoCells[k]);
		}
		this.setState({board:board});
	}

	/****************************************
	          CHECKING WIN CONDITION
	****************************************/

	clearMarked(){
		let board = this.state.board;
		for (i=0;i<GRID_SIZE;i++){
			for (j=0;j<GRID_SIZE;j++){
				if (board[i][j].marked && win){
					if (board[i][j].row === 0 || board[i][j].row === (GRID_SIZE-1)){
						let randomValue = this.generateRandomValue();
						board[i][j].value = randomValue;
						board[i][j].possible = randomValue;
						board[i][j].state = 'grey';
					}else{
						board[i][j].state = 'init';
						board[i][j].value = 0;
						board[i][j].possible = null;
					}
				}
				board[i][j].marked = false;
			}
		}
		this.setState({board:board});
		//if win, need to store date
	}

	checkWin(){
		//search the grid (as a tree) starting from top and continuing in all directions
		//for a connection from one edge to the other
		let board = this.state.board;
		let i = 0;
		let cell_row = 0;
		//start from top row
		while (win === false && i < GRID_SIZE){
			
			this.markAllConnected(board[i][cell_row]);
			
			//clear markings, and if win is true, clear all connected cells
			this.clearMarked();
			i = i + 1;

		}

		//regenerate helper cells in case of win
		if (win) this.refreshHelperCells();

		return;
	}

	// recursive function that should be called from a top cell
	// will mark all connected to input cell, ignore marked cells and update state
	// with win=true if reached bottom, but will keep going as long as it can
	markAllConnected(cell){
		
		//if cell already marked
		if (cell.marked) return;

		//if cell is empty
		if (cell.state !== 'domino') return;

		let cell_row = cell.row;
		let cell_col = cell.col;
		let board = this.state.board;
		board[cell_col][cell_row].marked = true;

		if (cell.edge === 'bottom' && win === false){
			//reached bottom, set win as true
			win = true;
		}
		this.setState({board:board});

		if (cell_row > 0){
			//cell not on vertical top, we can continue up
			this.markAllConnected(board[cell_col][cell_row-1]);
		}
		if (cell_row < (GRID_SIZE - 1)){
			//cell not on vertical bottom, we can continue down
			this.markAllConnected(board[cell_col][cell_row+1]);
		}
		if (cell_col > 0){
			//cell not on left most col, we can continue left
			this.markAllConnected(board[cell_col-1][cell_row]);	
		}
		if (cell_col < (GRID_SIZE - 1)){
			//cell not on right most col, we can continue right
			this.markAllConnected(board[cell_col+1][cell_row]);	
		}
		return;
	}

	/****************************************
	          UTILITY FUNCTIONS
	****************************************/

	async storeData(data){
		let response = null;

		let board = (data.board === undefined) ? null : data.board;
		let tiles = (data.tiles === undefined) ? null : data.tiles;
		let score = (data.score === undefined) ? null : data.score;

		if (board && tiles){
			response = await AsyncStorage.multiSet([
				['@thirtysix:board',JSON.stringify(board)],
				['@thirtysix:tiles',JSON.stringify(tiles)],
				['@thirtysix:currentScore',score.toString()]
			]);
		}else if (board){
			response = await AsyncStorage.multiSet([
				['@thirtysix:board',JSON.stringify(board)],
				['@thirtysix:currentScore',score.toString()]
			]);
		}else if (tiles){
			response = await AsyncStorage.setItem('@thirtysix:tiles',JSON.stringify(tiles));
		}else{
			console.log("store error");
		}
		return response;
	}

	/****************************************
	          RENDERING
	****************************************/

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
		this.storeData({tiles:tiles});
		this.setState({tiles:tiles});
	}

	render() {
		if(this.state.boardLoaded){
			return (
				<View style={styles.container}>
					<StatusBar hidden={true} />
					<Board data={this.state.board} />
					{this.renderTiles()}
					<View>
						<Text>Score:{this.state.score}</Text>
						<Text>Best Score:{this.state.bestScore}</Text>
						<Button title="RESET" onPress={()=>{this.resetBoard()}} />
					</View>
				</View>
			);
		}else{
			return(<View style={styles.container} ><StatusBar hidden={true} /></View>);
		}
	}


}