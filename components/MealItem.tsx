import { RootStackParamList } from '@/app';
import Meal from '@/models/meal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FC } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MealDetails from './MealDetails';



interface MealItemProps {
    mealData: Meal
}

const MealItem: FC<MealItemProps> = ({mealData}) => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'MealDetail'>>();

    const handleOnPress = () => {
        navigation.navigate('MealDetail', {mealId: mealData.id})
    }

    return (
        <View style={styles.rootContainer}>
            <Pressable android_ripple={{ color: '#ccc' }} style={({ pressed }) => [styles.pressableContainer, pressed ? styles.buttonPressed : null]} onPress={handleOnPress}>
                <View>
                    <Image source={{uri: mealData.imageUrl}} style={styles.imageContainer} />
                    <Text style={styles.titleContainer}>{mealData.title}</Text>
                </View>
                <MealDetails mealData={mealData} />
            </Pressable>
        </View>

    )
}

export default MealItem

const styles = StyleSheet.create({
    rootContainer: {
        margin: 16,
        borderRadius: 8,
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
        backgroundColor: 'white',
        elevation: 4,
        shadowColor: 'black',
        shadowOpacity: 0.25,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
    },
    pressableContainer: {
        overflow: 'hidden',
        borderRadius: 8,
    },
    imageContainer: {
        width: '100%',
        height: 200,

    },
    titleContainer: {
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 18,
        margin: 8,
    },
    buttonPressed: {
        opacity: 0.5,
    }
})