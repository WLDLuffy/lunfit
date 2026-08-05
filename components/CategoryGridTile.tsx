import Category from '@/models/category';
import { FC } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface CategoryGridTileProp {
    children?: any;
    item: Category;
    onPress: () => void;
}

const CategoryGridTile: FC<CategoryGridTileProp> = ({ children, item, onPress }) => {
    return <View style={[styles.rootContainer]}>
        <Pressable android_ripple={{color: "ccc"}} style={({pressed}) => [styles.buttonContainer, 
            pressed ? styles.buttonPressedContainer : null
        ]} onPress={onPress}>
            <View style ={[styles.cardContainer, {backgroundColor: item.color}]}>
                <Text style={styles.title}>
                    {item.title}
                </Text>
            </View>
        </Pressable>
    </View>
}

export default CategoryGridTile;

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        margin: 16, 
        height: 150,
        borderRadius: 8,
        elevation: 4,
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.25,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
        overflow: Platform.OS === 'android' ? 'hidden' : 'visible'
    },
    buttonContainer: {
        flex:1
    },
    buttonPressedContainer: {
        opacity: 0.5
    },
    cardContainer: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 18,
    }
})