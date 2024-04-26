import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Switch,
    StyleSheet,
    PermissionsAndroid,
    Platform,
    Alert,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import auth from '@react-native-firebase/auth';

const SettingsScreen = ({ navigation }) => {
    const [isOptionEnabled, setIsOptionEnabled] = useState(false);
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = auth().currentUser;
        setCurrentUser(user);
    }, []);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await auth().signOut();
            navigation.replace('Login');
        } catch (error) {
            Alert.alert("Error", "Failed to log out.");
            setLoading(false);
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            // iOS permission handling
        } else {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "This app needs access to your location.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                setIsLocationEnabled(granted === PermissionsAndroid.RESULTS.GRANTED);
            } catch (err) {
                console.warn(err);
                setIsLocationEnabled(false);
            }
        }
    };

    const toggleLocation = () => {
        if (!isLocationEnabled) {
            requestLocationPermission();
        } else {
            setIsLocationEnabled(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.userInfo}>Logged in as: {currentUser ? currentUser.email : 'Loading...'}</Text>
                </View>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.textHead}>Enable Option:</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isOptionEnabled ? "#007bff" : "#f4f3f4"}
                            onValueChange={() => setIsOptionEnabled(!isOptionEnabled)}
                            value={isOptionEnabled}
                        />
                    </View>
                </View>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.textHead}>Enable Location Tracking:</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isLocationEnabled ? "#007bff" : "#f4f3f4"}
                            onValueChange={toggleLocation}
                            value={isLocationEnabled}
                        />
                    </View>
                </View>
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={handleLogout} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Log Out</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3D3D3D',
        paddingBottom: 20,
    },
    content: {
        flexGrow: 1,
        paddingTop: 26,
        paddingHorizontal: 10,
    },
    card: {
        borderColor: '#007bff',
        borderWidth: 1,
        margin: 10,
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#3D3D3D',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Regular',
        marginBottom: 10,
    },
    textHead: {
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Bold',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 10,
        width: '85%',
        marginLeft: '7.5%',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'RedHatDisplay-Bold',
    },
});

export default SettingsScreen;