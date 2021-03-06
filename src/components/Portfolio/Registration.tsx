import React, {useEffect} from 'react'
import {View} from 'react-native';
import { useNavigation } from '@react-navigation/native'
import theme from '../../theme';
import TouchableButton from '../common/TouchableButton';

const Registration:React.FC = () => {
    const navigation = useNavigation()

    return(
        <View style={{flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent:'center'}}>
            <TouchableButton text='Log in into an existing wallet' onPress={() => navigation.navigate('Login')}/>
            <TouchableButton text='Import a wallet' onPress={() => navigation.navigate('MnemonicImport')}/>
            <TouchableButton text='Create a new wallet' onPress={() => navigation.navigate('Mnemonic')}/>
        </View>
    )
}

export default Registration
