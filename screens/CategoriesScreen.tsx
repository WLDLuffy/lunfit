import { RootStackParamList } from '@/app';
import CategoryGridTile from '@/components/CategoryGridTile';
import { CATEGORIES } from '@/data/dummy-data';
import Category from '@/models/category';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FC } from 'react';
import { FlatList } from 'react-native';

export interface CategoriesScreenProps {
    children?: any
    navigation: NativeStackNavigationProp<RootStackParamList, 'MealsCategories'>;
}


export const CategoriesScreen: FC<CategoriesScreenProps> = ({navigation}) => {
    const renderCategoryItem = (itemData: any) => {
        const cardItem: Category = itemData.item;
        const onPressHandler = () => {
                navigation.navigate('MealsOverview', {categoryId: cardItem.id})
        }
        return (
            <CategoryGridTile item={cardItem} onPress={onPressHandler} />
        );
    };
    return (
            <FlatList 
            data={CATEGORIES} 
            keyExtractor={(item: any)=> item.title} 
            numColumns={2}
            renderItem={renderCategoryItem} />
    );
}