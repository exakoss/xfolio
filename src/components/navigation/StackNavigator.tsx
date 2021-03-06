import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import theme from '../../theme';
import TabNavigator from './TabNavigator';
import {getFocusedRouteNameFromRoute, RouteProp} from '@react-navigation/native';
import SingleTokenView from '../SingleTokenView';
import SingleSynthView from '../Synth/SingleSynthView';

const StackNavigator:React.FC = () => {
    const Stack = createStackNavigator();
    const getHeaderTitle = (route:RouteProp<any, any>):string => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? 'Search'
        switch (routeName) {
            case 'FormikSearch':
                return 'Search'
            case 'Synthetix':
                return 'Synthetix Trading'
            case 'Watchlist':
                return 'Watchlist'
            case 'Portfolio':
                return 'Portfolio'
            default:
                return 'Search'
        }
    }

    return(
        <Stack.Navigator screenOptions={({route}) =>({
            headerTitle: getHeaderTitle(route),
            headerStyle: {backgroundColor: theme.colors.background, height: 60, borderBottomWidth: 1, borderBottomColor: "grey"},
            headerTitleStyle: {color: theme.colors.textWhite, textAlign: "center", fontSize: 30},
        })}>
            <Stack.Screen name="Home" component={TabNavigator}/>
            <Stack.Screen
                name="SingleTokenView"
                component={SingleTokenView}
                // @ts-ignore
                options={({route}) => ({headerTitle: route.params.tokenSymbol})}
            />
            <Stack.Screen
                name='SingleSynthView'
                component={SingleSynthView}
                // @ts-ignore
                options={({route}) => ({headerTitle: route.params.synthName})}/>
        </Stack.Navigator>
    )
}

export default StackNavigator
