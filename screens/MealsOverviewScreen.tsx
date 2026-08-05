import MealItem from '@/components/MealItem';
import { CATEGORIES, MEALS } from '@/data/dummy-data';
import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

// export interface MealsOverviewScreenProps {
//     children?: any
//     route: any
// }

export const MealsOverviewScreen = ({route, navigation}: any) => {

    const catId = route.params.categoryId;
    
    useEffect(() => {
        const catTitle = CATEGORIES.find((category) => category.id === catId)
        navigation.setOptions({
        title: catTitle ? catTitle.title : ""
    })

    }, [catId, navigation]);
    


    const displayedMeals = MEALS.filter((mealItem) => {
        return mealItem.categoryIds.indexOf(catId) >= 0;
    });

    const renderMealItem = (itemData: any) => {
        return <MealItem mealData={itemData.item} />
    }

    return (
        <View style={styles.rootContainer}>
            <FlatList 
                data={displayedMeals}
                keyExtractor={(item: any) => item.id} 
                renderItem={renderMealItem}
             />
        </View>
    )
}

const styles = StyleSheet.create({
    rootContainer: {    
        flex: 1,
        padding: 16,
    }
})