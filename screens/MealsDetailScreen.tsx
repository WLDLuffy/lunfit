import MealDetails from '@/components/MealDetails';
import { MEALS } from '@/data/dummy-data';
import { Image, StyleSheet, Text, View } from 'react-native';

const MealsDetailScreen = ({route}: any) => {
    const mealId = route.params.mealId;

    const selectedMeal = MEALS.find((meal) => meal.id === mealId);

    return (
        <View>
            <Image source={{uri: selectedMeal?.imageUrl}} style={styles.imageContainer}/>
            <Text style={styles.titleContainer}>{selectedMeal?.title}</Text>
            <MealDetails mealData={selectedMeal ? selectedMeal : null} />
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Ingredients</Text>
            </View>
            {selectedMeal?.ingredients.map((ingredient) => <Text style={styles.ingredientContainer} key={ingredient}>{ingredient}</Text>)}
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Steps</Text>
            </View>
            {selectedMeal?.steps.map((step) => <Text key={step}>{step}</Text>)}
        </View>
    )
}

export default MealsDetailScreen;

const styles = StyleSheet.create({
    imageContainer: {
        width: '100%',
        height: 350,
    },
    header: {
        color: '#e2b497',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerContainer: {
        margin: 4,
        padding: 6,
        borderBottomColor: '#e2b497',
        borderBottomWidth: 2,
        marginHorizontal: 24,
        marginVertical: 4,
    },
    ingredientContainer: {
        color: 'white',
        fontSize: 18,
    },
    stepContainer: {

    },
    titleContainer: {
        fontWeight: 'bold',
        fontSize: 24,
        margin: 4,
        padding: 6,
        textAlign: 'center',
        color: 'white',
    }
})