import Meal from '@/models/meal';
import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MealDetailsProps {
    mealData: Meal | null;
}

const MealDetails: FC<MealDetailsProps> = ({mealData}) => {
    return (
        <View style={styles.mealDescriptionContainer}>
            <Text style={styles.descriptionDetailsContainer}>{mealData?.duration} min</Text>
            <Text style={styles.descriptionDetailsContainer}>{mealData?.complexity.toUpperCase()}</Text>
            <Text style={styles.descriptionDetailsContainer}>{mealData?.affordability.toUpperCase()}</Text>
        </View>
    )
}

export default MealDetails;

const styles = StyleSheet.create({
    mealDescriptionContainer: {
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
        descriptionDetailsContainer: {
        marginHorizontal: 4,
        fontSize: 12,
    },
})