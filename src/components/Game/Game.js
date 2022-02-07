import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, CLEAR, ENTER, colorsToEmoji } from '../../constants'
import Keyboard from '../Keyboard'
import { borderColor } from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes';
import { getCurrentTimestamp } from 'react-native/Libraries/Utilities/createPerformanceLogger';
import words from '../../words';
import { copyArray, getDayOfTheYear, getDayKey } from '../../utils'
import AsyncStorage from '@react-native-async-storage/async-storage';
import EndScreen from '../EndScreen';

const NUMBER_OF_TRIES = 6;
const dayOfTheYear = getDayOfTheYear();
const dayKey = getDayKey();


const Game = () => {
 // AsyncStorage.removeItem('@game')
  const word = words[dayOfTheYear];
  const letters = word.split(''); // returner array av characters

  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState('playing'); // lost and play
  const [loaded, setLoaded] = useState(false);


  useEffect(() =>{
    if(curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  useEffect(() => {
      if(loaded) {
        persistState();
      }
  },[rows, curRow, curCol, gameState]);

  useEffect(() => {
      readState();
  }, [])

  const persistState = async () => {
      
      const dataForToday = {
          rows,
          curRow,
          curCol,
          gameState,
      };

      try {

        const existingStateString = await AsyncStorage.getItem('@game');
        const existingState = existingStateString ? JSON.parse(existingStateString) : {};
        existingState[dayKey] = dataForToday;

        const dataString = JSON.stringify(existingState);
        await AsyncStorage.setItem('@game', dataString);
      } catch(e) {
          console.log("Failed to write data to async storage", e);
      }
  }
  
  const readState = async () => {
      const dataString = await AsyncStorage.getItem('@game')
      try {
        const data = JSON.parse(dataString)
        const day = data[dayKey]
        setRows(day.rows);
        setCurCol(day.curCol);
        setCurRow(day.curRow);
        setGameState(day.gameState);
      } catch(e) {
          console.log("Couldnt parse the state");
      }
      setLoaded(true);
  }


  const checkGameState = () => {
    if (checkIfWon() && gameState !== 'won' ) {
      setGameState('won')
    } else if (checkIfLost() && gameState !== 'lost') {
       setGameState('lost')
    }
  }

  const checkIfWon = () => {
    const row = rows[curRow - 1];

    return row.every((letter, i)  => letter === letters[i])
  }

  const checkIfLost = () => {
    return !checkIfWon() && curRow === rows.length;
  }

  const onKeyPressed = (key) => {
    if(gameState !== 'playing') {
      return;
    }

    const updatedRows = copyArray(rows);

    if(key === CLEAR) {
      const prevCol = curCol - 1;
      if(prevCol >= 0){
        updatedRows[curRow][prevCol] = "";
        setRows(updatedRows);
        setCurCol(prevCol);
      }
      return;
    }

    if(key === ENTER) {
      if(curCol === rows[0].length){
        setCurRow(curRow + 1);
        setCurCol(0);
      }
      return;
    }

    if(curCol < rows[0].length){
      updatedRows[curRow][curCol] = key;
      setRows(updatedRows);
      setCurCol(curCol + 1);
    }
  };
  
  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  }

  const getCellBGColor = ( row, col) => {
    const letter = rows[row][col]
    if(row >= curRow) {
      return colors.black
    }
    if(letter === letters[col]) {
      return colors.primary;
    }
    if(letters.includes(letter)) {
      return colors.secondary;
    }
    return colors.darkgrey;
  }

  const getAllLettersWithColor = (color) => {
    return rows.flatMap((row, i) => 
    row.filter((cell, j) => getCellBGColor(i, j) === color));
  }

  const greenCaps = getAllLettersWithColor(colors.primary);

  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);

  if(!loaded) {
      return (<ActivityIndicator />)
  }

  if(gameState !== 'playing') {
      return (<EndScreen won={gameState === 'won'} rows={rows} getCellBGColor={getCellBGColor} />)
  }

  return (
    <>
      <ScrollView style={styles.map}>
        {rows.map((row, i) => (
          <View key={`row-${i}`} style={styles.row}>
          {row.map((letter, j) => ( 
            <View 
              key={`cell-${i}-${j}`}
              style={[
                styles.cell, 
                {
                  borderColor: isCellActive(i, j) 
                  ? colors.grey 
                  : colors.darkgrey,
                  backgroundColor: getCellBGColor(i, j),
                },
              ]}
             >
              <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
            </View>
          ))}
          </View>
        ))}
      </ScrollView>

      <Keyboard 
      onKeyPressed={onKeyPressed} 
      greenCaps={greenCaps} 
      yellowCaps={yellowCaps}
      greyCaps={greyCaps}/>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cell: {
    borderWidth: 3,
    borderColor: colors.darkgrey,
    flex: 1,
    maxWidth: 70,
    aspectRatio: 1,
    margin: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    color: colors.lightgrey,
    fontWeight: 'bold',
    fontSize: 28,
  }
});

export default Game