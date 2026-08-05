import { CategoriesScreen, CategoriesScreenProps } from '@/screens/CategoriesScreen';
import MealsDetailScreen from '@/screens/MealsDetailScreen';
import { MealsOverviewScreen } from '@/screens/MealsOverviewScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  MealsCategories: CategoriesScreenProps;
  MealsOverview: any;
  MealDetail: any;
}

const HomeScreen = () => {

  return (
    <>
      {/* <NavigationContainer> */}
          <Stack.Navigator screenOptions={{
              headerStyle: { backgroundColor: ' #351401'},
              headerTintColor: 'black',
              contentStyle: { backgroundColor: '#3f2f25'}
          }}>
            <Stack.Screen  name="MealsCategories" component={CategoriesScreen}/>
            <Stack.Screen  name="MealsOverview" component={MealsOverviewScreen} options={{
              title: 'All Categories',

            }}/>
            <Stack.Screen name="MealDetail" component={MealsDetailScreen} />
          </Stack.Navigator>
      {/* </NavigationContainer> */}
    </>
  )



}

export default HomeScreen;

const styles = StyleSheet.create({
  rootContainer: {
    
  }
})