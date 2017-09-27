import React, { Component } from 'react';
import {
	StyleSheet, Dimensions
} from 'react-native';

//should not be smaller than 4
GRID_SIZE = 7;

const {height, width} = Dimensions.get('window');
cell_dim = Math.floor(width/GRID_SIZE);
BOARD_TOP = -407;
BOARD_LEFT = 4;
TILES_TOP = 0;
INITIAL_TILES = 3;
MIDDLE_MARGIN = 0.33;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	row:{
		flexDirection:'row',
	},
	textHeader:{
		fontSize:24,
		textAlign: 'center',
	},
	textSubheader:{
		fontSize: 18,
		textAlign: 'center',
	},
	textinput: {
		height: 40,
		width: 150,
		textAlign: 'center',
	},
	regularText: {
		fontSize: 16,
	},
	errorLabel: {
		fontSize: 14,
		color: 'red',
	},
	board: {
		borderWidth:4,
		height:width,
		width:width,
		flexDirection:'row',
	},
	cell: {
		borderWidth: 1,
		height: cell_dim,
		width: cell_dim,
		alignItems: 'center',
		justifyContent: 'center',
	},
	col: {
		borderWidth: 1,
		height: cell_dim * GRID_SIZE,
		width: cell_dim,
	},
	cell_grey: {
		color: '#ccc',
	},
	cell_init: {
		color: '#fcb',
	},
	cell_domino: {
		color: 'black',
	},
	tile: {
		height: 2* (cell_dim) - 10,
		width: cell_dim - 10,
		borderColor: '#87CEEB',
		borderWidth: 3,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 5,
		margin: 3,
		overflow: 'hidden',
	},
	tiletext: {
		color: '#87CEEB',
		fontSize: 50,
	},
	tilebar: {
		height:100,
		width:100,
	}
});

export {styles,GRID_SIZE,cell_dim,BOARD_TOP,BOARD_LEFT,TILES_TOP,INITIAL_TILES,MIDDLE_MARGIN};
