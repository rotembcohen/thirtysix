import React, { Component } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';

import {styles, GRID_SIZE} from '../Styles';

export default class Board extends Component {
	
	renderCell(i,j){
		let cell = this.props.data[i][j];
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
					<View key={'row_' + i + '_col_' + j} style={styles.cell}>
						{this.renderCell(i,j)}
					</View>
				);
			}
			grid.push(<View key={'col_'+i} style={styles.col}>{col}</View>);
		}
		return grid;
	}

	render (){
		return (
			<View style={styles.board}>
				{this.createBoard()}
			</View>
		);
	}
}