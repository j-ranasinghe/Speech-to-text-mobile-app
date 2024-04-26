import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TextInput, Linking, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { parseISO } from 'date-fns';

interface HistoryRecord {
    date: string;
    time: string;
    location: string;
    transcript: string;
    sentiment: string;
    id: string;
}

const HistoryScreen: React.FC = () => {
    const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const currentUser = auth().currentUser;
                if (currentUser) {
                    const userEmail = currentUser.email;
                    const data = JSON.stringify({
                        "collection": "Sentiment",
                        "database": "Whisper",
                        "dataSource": "Cluster0",
                        "filter": {
                            "email": userEmail
                        },
                        "sort": {
                            "date-time": -1
                        }
                    });

                    const config = {
                        method: 'post',
                        url: 'https://ap-southeast-1.aws.data.mongodb-api.com/app/data-mstwkbg/endpoint/data/v1/action/find',
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Request-Headers': '*',
                            'api-key': '',
                            'Accept': 'application/json'
                        },
                        data: data
                    };

                    const response = await axios(config);

                    const records = response.data.documents.map(doc => ({
                        date: parseISO(doc['date-time']).toISOString().split('T')[0],
                        time: parseISO(doc['date-time']).toTimeString().split(' ')[0],
                        location: `geo:${doc.location.coordinates[1]},${doc.location.coordinates[0]}`,
                        transcript: doc.transcript,
                        sentiment: doc.sentiment,
                        id: doc._id
                    }));

                    setHistoryRecords(records);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };

        fetchHistory();
    }, []);

    const openMap = (location: string) => {
        Linking.openURL(location);
    };


    if (loading) {
        return <View style={styles.loading}><Text>Loading...</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            {historyRecords.map((record, index) => (
                <View key={record.id} style={styles.card}>
                    <View style={styles.row}>
                        <Image source={require('calendar.png')} style={styles.icon} />
                        <Text style={styles.textHead}>{record.date}</Text>
                        <Image source={require('time.png')} style={styles.icon} />
                        <Text style={styles.textHead}>{record.time}</Text>
                    </View>
                    <View style={styles.row}>
                        <Image source={require('location.png')} style={styles.icon} />
                        <Text style={styles.textHead}>Location:</Text>
                        <TouchableOpacity onPress={() => openMap(record.location)}>
                            <Text style={styles.textHead2}>Click to visit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                        <Image source={require('transcript.png')} style={styles.icon} />
                        <Text style={styles.textHead}>Transcript</Text>
                        <TextInput
                            multiline
                            scrollEnabled={true}
                            editable={false}
                            value={record.transcript}
                            style={styles.textAreaContainer}
                        />
                    </View>
                    <View style={styles.row}>
                        <Image source={require('senti.png')} style={styles.icon} />
                        <Text style={styles.textHead}>Sentiment</Text>
                        <Text style={styles.text}>{record.sentiment}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    loading: {
        backgroundColor: '#3D3D3D',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 10,
        paddingHorizontal: 10,
        fontFamily: 'RedHatDisplay-bold',
        fontSize: 20,
    },
    container: {
        flex: 1,
        paddingTop: 24,
        paddingBottom: 10,
        paddingHorizontal: 10,
        backgroundColor: '#3D3D3D',
        height: '100%',
    },
    card: {
        borderColor: '#007bff',
        backgroundColor: '#3D3D3D',
        borderWidth: 1,
        margin: 10,
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    text: {
        marginRight: 3,
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Regular',
        width: '70%',
    },
    textHead: {
        marginRight: 8,
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Bold',
    },
    textHead2: {
        marginRight: 8,
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Regular',
    },
    textAreaContainer: {
        marginTop: 10,
        borderRadius: 13,
        width: '70%',
        maxHeight: 400,
        minHeight: 1,
        color: '#ffffff',
        textAlignVertical: 'top',
        overflow: 'scroll',
        fontFamily: 'RedHatDisplay-Regular',

    },
});

export default HistoryScreen;
