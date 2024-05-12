import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface Props {
    navigation: any;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Image
                source={require('Whisper3.png')}
                style={styles.image}
            />
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('SpeechToText')}>
                <Text style={styles.buttonText}>Try Whisper</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('History')}>
                <Text style={styles.buttonText}>My History</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.buttonSettings}
                onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#3D3D3D',
    },
    // Style for the logo image
    logo: {
        width: 300,
        height: 200,
        marginBottom: 30,
    },
    image: {
        width: 300,
        height: 300,
        marginBottom: 200,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        marginVertical: 5,
        borderRadius: 15,
        width: 240
    },
    buttonSettings: {
        borderColor: '#007bff', // Border color
        borderWidth: 2, // Border width
        backgroundColor: 'transparent', // Transparent background
        padding: 10,
        marginVertical: 5,
        borderRadius: 15,
        width: 240
    },
    buttonText: {
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-ExtraBold',
        textAlign: 'center',
        fontSize: 20,
    },
});

export default HomeScreen;
