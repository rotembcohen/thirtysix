import React from 'react';
import { StackNavigator } from 'react-navigation';

import GameView from './containers/GameView';

const App = StackNavigator({
    GameView: {screen: GameView},
},
{
    initialRouteName: 'GameView'
});

export default App;
