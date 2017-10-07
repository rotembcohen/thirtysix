import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { styles, GRID_SIZE } from '../Styles';

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

		let cellStyle = null;
		if (cell.state!=='domino' && cell.possible===-1){
			cellStyle= [styles.cell,styles.cellHole];
		}else{
			cellStyle= styles.cell;
		}

		return (
			<View key={'row_' + i + '_col_' + j} style={cellStyle}>
				<Text style={style}>{(cell.state==='domino'||cell.state==='grey')?cell.value:cell.possible}</Text>
			</View>
		);
	}

	createBoard(){
		let grid = [];
		for (let i = 0; i < GRID_SIZE; i++) { 
			let col = [];
			for (let j = 0; j < GRID_SIZE; j++){
				col.push(this.renderCell(i,j));
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