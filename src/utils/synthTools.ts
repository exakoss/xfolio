import {Network, Synth, synthetix, SynthetixJS} from '@synthetixio/js'
import {createKovanProvider, createMainnetProvider, getContractCurrentBalance} from './ethersTools';
import {
    Block,
    BlockOption,
    DataSource,
    PriceChartEntry,
    SynthData,
    TokenData,
    TokenListEntry,
    WatchlistEntry,
} from '../types';
import {
    calculateETHPrice,
    GetBlockProp,
    getDailyQuotesByID,
    getTokenPrices,
    getTokensByID,
    transformUNIQuotesToTokenListEntry
} from './index';
import {store} from '../store';
import {synthRateClient} from '../graphql/client';
import {GET_LATEST_RATE, GET_RATE_BY_BLOCK} from '../graphql/synthQueries';
import {ethers, Wallet} from 'ethers'
//@ts-ignore
import snxData from 'synthetix-data'

export const createMainnetSnxjs = () => {
    const mainnetProvider = createMainnetProvider()
    return synthetix({network: Network.Mainnet, provider: mainnetProvider})
}

export const createKovanSnxjs = () => {
    const kovanProvider = createKovanProvider()
    return synthetix({network: Network.Kovan, provider: kovanProvider})
}

export const createConnectedSnxjs = () => {
    const wallet = store.getState().wallet.wallet
    if (wallet) return synthetix({signer: wallet})
}

export const listAllSynths = (snxjs:SynthetixJS):Synth[] => {
    return snxjs.synths.map((s) => s)
}

export const findSynthByName = (snxjs:SynthetixJS, synthName:string):Synth | undefined => {
    const synth = snxjs.synths.find((s) => s.name === synthName)
    if (synth) {
        return synth
    } else {
        return undefined
    }
}

export const getSynthAddress = (snxjs:SynthetixJS, synthName:string):string | undefined => {
    const synthToken = snxjs.tokens.find(t => t.symbol === synthName)
    return (synthToken) ? synthToken.address : undefined
}

export const getLatestSynthRate = async (synthName:string) => {
    let result = await synthRateClient.query({
        query:GET_LATEST_RATE,
        variables: {
            synthName: synthName
        }
    })
    return Number(ethers.utils.formatEther(result.data.latestRate.rate))
}

export const getLatestSynthData = async(synth:Synth):Promise<SynthData> => {
    const newSynthRate = await getLatestSynthRate(synth.name)
    return {
        ...synth,
        formattedRate: newSynthRate
    }
}

export const getLatestSynthsDatas = async(synths:Synth[]):Promise<SynthData[]> => {
    return await Promise.all(synths.map(async (s) => {
        return await getLatestSynthData(s)
    }))
}

export const getSynthRateByBlock = async(synthName:string,blockNumber:number) => {
    let result = await synthRateClient.query({
        query:GET_RATE_BY_BLOCK,
        variables: {
            synthName:synthName,
            blockNumber:blockNumber
        }
    })
    if (result.data.rateUpdates[0]) return Number(ethers.utils.formatEther(result.data.rateUpdates[0].rate))
    else return 0
}

//Rebuild without snxjs by using synthName only
export const getTokenListEntryFromWatchlistEntry = async (snxjs:SynthetixJS,watchlistEntry:WatchlistEntry,dailyBlock:number,currentETHPrice:number):Promise<TokenListEntry> => {
    switch (watchlistEntry.dataSource) {
        case 'SYNTH':
            const currentSynth = findSynthByName(snxjs,watchlistEntry.id)
            if (currentSynth) {
                const currentSynthRate = await getLatestSynthRate(currentSynth.name)
                const dailySynthRate = await getSynthRateByBlock(currentSynth.name,dailyBlock)
                const synthAddress = getSynthAddress(snxjs,currentSynth.name)
                return {
                    ...currentSynth,
                    formattedRate: currentSynthRate,
                    formattedRateDaily: dailySynthRate,
                    address: synthAddress,
                    dataSource: watchlistEntry.dataSource
                }
            }
        case 'UNI':
            const newTokenData = await getTokensByID([watchlistEntry.id])
            const newDailyTokenData = await getDailyQuotesByID([watchlistEntry.id],dailyBlock)
            return transformUNIQuotesToTokenListEntry(newTokenData,newDailyTokenData,currentETHPrice)[0]
    }
}

export const getTokenListEntriesFromWatchlistEntries = async (watchlistEntries:WatchlistEntry[]):Promise<TokenListEntry[]> => {
    // const snxjs = createMainnetSnxjs()
    const snxjs = createKovanSnxjs()
    if (!snxjs) throw ('No signer has been connected')
    const newDailyBlock = store.getState().dailyBlock.blockNumber
    const newCurrentETHPrice = store.getState().ethPrice.price
    return await Promise.all(watchlistEntries.map(async (e) => {
        return await getTokenListEntryFromWatchlistEntry(snxjs,e,newDailyBlock,newCurrentETHPrice)
    }))
}

export const addQuantityToTokenListEntry = async (tokenListEntry:TokenListEntry,wallet:Wallet):Promise<TokenListEntry> => {
    const balance:number = await getContractCurrentBalance(wallet,tokenListEntry.address as string)
    return {
        ...tokenListEntry,
        quantity: balance
    }
}

export const addQuantitiesToTokenListEntries = async (tokenListEntries:TokenListEntry[],wallet:Wallet):Promise<TokenListEntry[]> => {
    return await Promise.all(tokenListEntries.map(async (tle) => {
        return await addQuantityToTokenListEntry(tle,wallet)
    }))
}

export const getPriceChartPrices = async (blocks:Block[],id:string,dataSource:DataSource):Promise<PriceChartEntry[]> => {
    //We slice the last element of blocks array, because this block is too recent and probably hasn't been indexed by TheGraph yet
    //later we will concat the latest price of a synth or a uniswap token
    const trimmedBlocks = blocks.slice(0,-1)
    switch (dataSource) {
        case 'UNI':
            const lastETHPrice = store.getState().ethPrice.price
            const parsedPrices = await getTokenPrices(id,trimmedBlocks)
            const lastTokenData = await getTokensByID([id])
            const lastUniRate = calculateETHPrice(lastTokenData.tokens[0].derivedETH,lastETHPrice)
            return parsedPrices.concat({formattedRate:lastUniRate})
        case 'SYNTH':
            const lastSynthRate = await getLatestSynthRate(id)
            const parsedSynthRates:PriceChartEntry[] = await Promise.all(trimmedBlocks.map(async (b)=> {
                const newSynthRate = await getSynthRateByBlock(id,Number(b.number))
                return {formattedRate: newSynthRate}
            }))
            return parsedSynthRates.concat({formattedRate:lastSynthRate})
    }
}

export const getTimestampInSeconds = (period: GetBlockProp):number => {
    switch (period) {
        case 'CURRENT_DAY':
            return Math.round(new Date().getTime()/1000)
        case 'ONE_DAY':
            return Math.round(new Date().getTime()/1000) - 86400
        case 'TWO_DAYS':
            return Math.round(new Date().getTime()/1000) - 172800
        default:
            return 0
    }
}

export const fetchExchanges = (period:GetBlockProp) => {
    return snxData.exchanges.since({
        minTimestamp: getTimestampInSeconds(period)
    })
}

export const calculateTotalVolumeForSynth = (baseCurrencyKey:string, quoteCurrencyKey:string, exchanges:any):number => {
    return exchanges
        .filter(
            (exchange:any) =>
                (exchange.fromCurrencyKey === quoteCurrencyKey &&
                    exchange.toCurrencyKey === baseCurrencyKey) ||
                (exchange.fromCurrencyKey === baseCurrencyKey &&
                    exchange.toCurrencyKey === quoteCurrencyKey)
        )
        .reduce((totalVolume:number, exchange:any) => {
            totalVolume += exchange.fromAmountInUSD;
            return totalVolume;
        }, 0)
}

export const getSynthVolumeInUSD = async (baseCurrencyKey:string, quoteCurrencyKey:string, period:GetBlockProp):Promise<number> => {
    try {
        const exchanges = await fetchExchanges(period);
        return calculateTotalVolumeForSynth(baseCurrencyKey, quoteCurrencyKey, exchanges);
    } catch (e) {
        return 0
    }
};

export const fetchSynthSupply = async (snxjs:SynthetixJS, synth: Synth, blockOption:BlockOption) => {
    const {formatEther} = snxjs.utils
    return Number(formatEther(await snxjs.contracts[`Synth${synth.name}`].totalSupply(blockOption)))
}

export const getSynthSupplyInUSD = (synthSupply:number, synthRate:number) => {
    return synthSupply * synthRate
}
