import  {View,Text} from 'react-native'
import React from 'react'
import { FlatList } from 'react-native-gesture-handler'


export default function Chatlist({users}){
        return(
            <View ClassName="flex-1">
               <FlatList>
                data={users}
                contentContainerStyle={{flex:1,paddingVertical:25}}
                keyExtractor={item=>Math.random()}
                shows

               </FlatList>
            </View>
        )
}