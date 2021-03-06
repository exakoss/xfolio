import React, {useEffect, useState} from 'react'
import {View} from 'react-native';
import theme from '../../theme';
import {TokenListEntry,WatchlistEntry} from '../../types';
import {
    createMainnetSnxjs,
    listAllSynths,
    getTokenListEntriesFromWatchlistEntries,
    createKovanSnxjs
} from '../../utils/synthTools';
import {SynthetixJS} from '@synthetixio/js';
import TokenList from '../TokenList';

const SynthDisplay:React.FC = () => {
    const [isLoading,setIsLoading] = useState<boolean>(true)
    const [tokenData,setTokenData] = useState<TokenListEntry[]>([])
    const listPlaceholder = 'The synth list is currently empty'

    useEffect(() => {
            const fetchAndUpdateSynthData = async () => {
                // const snxjs:SynthetixJS = createMainnetSnxjs()
                const snxjs = createKovanSnxjs()
                const synthEntryList:WatchlistEntry[] = listAllSynths(snxjs).map((s) => {
                    return {id:s.name,dataSource: "SYNTH"}
                })
                const passedSynths = await getTokenListEntriesFromWatchlistEntries(synthEntryList)
                setTokenData(passedSynths)
                setIsLoading(false)
            }
            fetchAndUpdateSynthData()
        }
    ,[])

    return(
        <View style={{flex: 1,backgroundColor: theme.colors.background}}>
            <TokenList tokens={tokenData} placeholder={listPlaceholder} isLoading={isLoading}/>
        </View>
    )
}

export default SynthDisplay
