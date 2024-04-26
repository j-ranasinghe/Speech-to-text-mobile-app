import React, { useState } from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image} from 'react-native';
import auth from '@react-native-firebase/auth';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        setLoading(true);
        setErrorMessage('');

        try {
            await auth().signInWithEmailAndPassword(email, password);
            navigation.replace('Home');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                try {
                    await auth().createUserWithEmailAndPassword(email, password);
                    navigation.replace('Home');
                } catch (signupError) {
                    setErrorMessage(signupError.message);
                }
            } else {
                setErrorMessage(error.message);
            }
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('welcome.png')}
                style={styles.image}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
            />
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Login / Sign Up</Text>
                )}
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
    input: {
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#007bff',
        padding: 10,
        width: '89%',
        color: '#fff',
        backgroundColor: '#2D2D2D',
        fontFamily: 'RedHatDisplay-Regular',
        borderRadius: 10,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '60%',
        fontFamily: 'RedHatDisplay-Bold',
        marginTop: 10,
        marginBottom: 170,
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'RedHatDisplay-Bold',
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 20,
    }
});

export default LoginScreen;