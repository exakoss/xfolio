import React, {useState, useEffect} from 'react'
import {View, Button, Text, ScrollView} from 'react-native';
import { useNavigation } from '@react-navigation/native'
import theme from '../../theme';
import { Wallet } from 'ethers'
import {createKovanWallet, createRinkebyWallet, createMainnetWallet} from '../../utils/ethersTools';
import LoadingScreen from '../LoadingScreen';
import {RootStateOrAny, useDispatch, useSelector} from 'react-redux';
import {setWallet} from '../../reducers/walletReducer';
import TouchableButton from '../common/TouchableButton';

export const MnemonicPhraseView:React.FC<{phrase: string| undefined}> = ({phrase}) => {
    if (!phrase) return null
    // console.log(phrase)
    const mnemonicPhrase = phrase.split(" ",12)
    // console.log(mnemonicPhrase)
    return(
        <View style={{flexDirection:"row", flexWrap:"wrap", justifyContent:'center', marginTop:theme.distance.normal}}>
            {mnemonicPhrase.map(w => {
                    return(
                        <View style={{borderRadius: 5,
                            marginVertical: theme.distance.small,
                            marginHorizontal: theme.distance.tiny,
                            padding: theme.distance.tiny,
                            borderWidth: 2,
                            borderColor: theme.colors.textSecondary,
                            backgroundColor: theme.colors.darkBrown

                        }}
                            key = {w}
                        >
                            <Text style={{color: theme.colors.textWhite, fontSize: theme.fontsize.normal}}>{w}</Text>
                        </View>
                    )
                })}
        </View>
    )
}

const Mnemonic:React.FC = () => {
    const navigation = useNavigation()
    const dispatch = useDispatch()
    const [isLoading,setIsLoading] = useState<boolean>(true)

    useEffect(() => {

        const asyncHook = async() => {
            // const newWallet = createRinkebyWallet()
            const newWallet = await createKovanWallet()
            // const newWallet = createMainnetWallet()
            dispatch(setWallet(newWallet))
            setIsLoading(false)
        }
        asyncHook()
    },[])
    const connectedWallet = useSelector((state:RootStateOrAny) => state.wallet.wallet)

    if (isLoading) return <LoadingScreen placeholder='Generating a wallet...'/>
    return(
        <View style={{flex: 1,backgroundColor: theme.colors.background, alignItems: "center", justifyContent:'center'}}>
            <View style={{marginHorizontal: theme.distance.small}}>
                <Text style={{color: theme.colors.textWhite, fontSize: theme.fontsize.normal, textAlign:'center'}}>This is your new mnemonic phrase:</Text>
            </View>
            <MnemonicPhraseView phrase={connectedWallet?.mnemonic.phrase}/>
            <View style={{marginHorizontal: theme.distance.small}}><Text style={{color: theme.colors.textWhite, fontSize: theme.fontsize.big, textAlign:'center'}}>MAKE SURE TO WRITE IT DOWN AND NEVER SHARE IT WITH ANYBODY ELSE!</Text></View>
            <View style={{marginHorizontal: theme.distance.small}}><Text style={{color: theme.colors.textWhite, fontSize: theme.fontsize.normal, textAlign:'center'}}>Your mnemonic phrase could be used to import the wallet and get full access to it.</Text></View>
            <TouchableButton text='Set up the password' onPress={() => navigation.navigate('PasswordInput')}/>
        </View>
    )
}

export default Mnemonic
