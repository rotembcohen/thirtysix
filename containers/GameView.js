import React, { Component } from 'react';
import { View, Text, Dimensions, AsyncStorage, StatusBar } from 'react-native';
import { Col, Row, Grid } from "react-native-easy-grid";

import {styles, GRID_SIZE} from '../Styles';

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
		}
	}

	async resetBoard(){
		board = this.createBoardValues();
		await AsyncStorage.setItem('@thirtysix:board',JSON.stringify(board));
		return board;
	}

	async componentWillMount(){
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

	renderCell(i,j){
		let cell = this.state.board[i][j];
		let style = null;
		if (cell.state === 'grey'){
			style = styles.cell_grey;
		} else if (cell.state === 'init'){
			style = styles.cell_init;
		} else {
			style = styles.cell_domino;
		}

		return (<Text style={style}>{cell.value}</Text>);
	}

	createBoard(){
		let grid = [];
		for (let i = 0; i < GRID_SIZE; i++) { 
			let col = [];
			for (let j = 0; j < GRID_SIZE; j++){
				col.push(
					<Row key={'row_' + i + '_col_' + j} style={styles.cell}>
						{this.renderCell(i,j)}
					</Row>
				);
			}
			grid.push(<Col key={'col_'+i} style={styles.col}>{col}</Col>);
		}
		return grid;
	}

	render() {
		
		return (
			<Grid style={styles.container}>
				<StatusBar hidden={true} />
				<Row style={styles.board}>
					{this.createBoard()}
				</Row>
				<Row style={{borderWidth:1,width:100,height:20}}>
					<Text>Grid size:{GRID_SIZE}</Text>
					{/*Dominoes*/}
				</Row>
			</Grid>
		);
	}


}