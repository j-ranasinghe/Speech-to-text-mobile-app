import React, { useState, useEffect, useCallback } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert} from 'react-native';
import Voice from '@react-native-voice/voice';
import { Bar } from 'react-native-progress';
import { useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import { initWhisper } from 'whisper.rn';
import AudioRecorderPlayer, {
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
    AudioEncoderAndroidType,
    AudioTypeAndroid
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';



const SpeechToTextScreen: React.FC = () => {
    const [isLiveRecording, setIsLiveRecording] = useState(false);
    const [hasLiveRecorded, setHasLiveRecorded] = useState(false);
    const [text, setText] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [showTranscriptButton, setShowTranscriptButton] = useState(false);
    const [showTranscriptTextArea, setShowTranscriptTextArea] = useState(false);
    const [showGetSentimentButton, setShowGetSentimentButton] = useState(false);
    const [showSentimentTextArea, setShowSentimentTextArea] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [sentiment, setSentiment] = useState('');
    const [showSavingSuccess, setShowSavingSuccess] = useState(false);
    const [whisperContext, setWhisperContext] = useState<any>(null);
    const [transcriptionResult, setTranscriptionResult] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [audioFilePath, setAudioFilePath] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(true);


    const audioRecorderPlayer = new AudioRecorderPlayer();

    useEffect(() => {
        Voice.onSpeechResults = (event: any) => {
            setText(event.value ? event.value[0] : '');
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    useEffect(() => {
        prepareRecorder();
    }, []);


    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLiveRecording) {
            interval = setInterval(() => {
                setAudioLevel(Math.random());
                if (startTime) {
                    const currentTime = new Date();
                    setDuration(Math.floor((currentTime.getTime() - startTime.getTime()) / 1000));
                }
            }, 100);
        } else { // @ts-ignore
            if (interval) {
                clearInterval(interval);
            }
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isLiveRecording, startTime]);

    useEffect(() => {
        (async () => {
            const context = await initWhisper({
                filePath: require('ggml-tiny.en.bin'),
            });
            setWhisperContext(context);
        })();
    }, []);
    useFocusEffect(
        useCallback(() => {
            return () => {
                setHasLiveRecorded(false);
                setShowTranscriptButton(false);
                setShowTranscriptTextArea(false);
                setShowGetSentimentButton(false);
                setShowSentimentTextArea(false);
                setIsLiveRecording(false);
            };
        }, [])
    );
    const prepareRecorder = async () => {
        try {
            await audioRecorderPlayer.setSubscriptionDuration(0.09); // Optional. Default is 0.1
            await audioRecorderPlayer.prepare({
                AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
                AudioSourceAndroid: audioRecorderPlayer.AUDIO_SOURCE_MIC,
                AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
                AVNumberOfChannelsKeyIOS: 1,
                AVFormatIDKeyIOS: AVEncodingOption.aac,
                AVSampleRateKeyIOS: 16000,
                AVBitRateKeyIOS: 256000,
                OutputFormatAndroid: AudioTypeAndroid.WAV,
            });
        } catch (e) {
            console.error(e);
        }
    };

    const startRecording = async () => {
        setIsRecording(true);
        setHasRecorded(false);

        try {
            const path = `${RNFS.DocumentDirectoryPath}/recorded_audio.wav`;
            await audioRecorderPlayer.startRecorder(path);
            setAudioFilePath(path);
        } catch (e) {
            console.error(e);
        }
    };

    const stopRecording = async () => {
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            setIsRecording(false);
            setHasRecorded(true);
        } catch (e) {
            console.error(e);
        }
    };


        const determineSentiment = (score: number) => {
        return score >= 0 ? 'Positive' : 'Negative';
    };

    const saveTranscript = async (text: string, sentiment: string) => {
        const currentUser = auth().currentUser;
        if (currentUser) {
            const userEmail = currentUser.email;

            Geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    const currentDateTime = new Date().toISOString();

                    const data = {
                        "date-time": currentDateTime,
                        "email": userEmail,
                        "location": {
                            "type": "Point",
                            "coordinates": [longitude, latitude]
                        },
                        "sentiment": sentiment,
                        "transcript": text
                    };

                    fetch("https://ap-southeast-1.aws.data.mongodb-api.com/app/data-mstwkbg/endpoint/data/v1/action/insertOne", {
                        method: "POST",
                        headers: {
                            "apiKey": "w",
                            "Content-Type": "application/ejson",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            collection: "Sentiment",
                            database: "Whisper",
                            dataSource: "Cluster0",
                            document: data
                        })
                    })
                        .then(response => {
                            if (response.ok) {
                                console.log("Transcript saved successfully");
                            } else {
                                console.error("Failed to save transcript");
                            }
                        })
                        .catch(error => {
                            console.error("Error saving transcript:", error);
                        });
                },
                error => {
                    console.error("Error getting location:", error);
                    Alert.alert("Error", "Failed to get device location");
                }
            );
        }
    };

    const saveTranscriptWithSentiment = async (text: string) => {
        const sentimentData = await analyzeSentiment(text);
        if (sentimentData && sentimentData.documentSentiment && sentimentData.documentSentiment.score !== undefined) {
            const sentimentScore = sentimentData.documentSentiment.score;
            const sentiment = determineSentiment(sentimentScore);
            saveTranscript(text, sentiment);
            setShowSavingSuccess(true);

            setTimeout(() => {
                setShowSavingSuccess(false);
            }, 3000);
        } else {
            console.error('Failed to analyze sentiment or invalid sentiment data');
        }
    };
    const startRealTimeRecording = async () => {
        setIsLiveRecording(true);
        setShowTranscriptButton(false);
        setShowTranscriptTextArea(false);
        setShowGetSentimentButton(false);
        setShowSentimentTextArea(false);
        setIsLive(true);
        setStartTime(new Date());
        try {
            await Voice.start('en-US');
            if (whisperContext) {
                const {stop, subscribe} = await whisperContext.transcribeRealtime();
                subscribe((evt: any) => {
                    const {isCapturing, data, processTime, recordingTime} = evt;
                    setTranscriptionResult(data.result);
                    console.log(
                        `Realtime transcribing: ${isCapturing ? 'ON' : 'OFF'}\n` +
                        `Result: ${data.result}\n\n` +
                        `Process time: ${processTime}ms\n` +
                        `Recording time: ${recordingTime}ms`
                    );
                    if (!isCapturing) {
                        console.log('Finished realtime transcribing');
                    }
                });
            }
        }catch (e) {
            console.error(e);
        }
    };

    const stopRealTimeRecording = async () => {
        setIsLiveRecording(false);
        setTranscript(transcriptionResult);
        setTranscriptionResult('');
        setShowTranscriptButton(true);
        try {
            await Voice.stop();
        } catch (error) {
            console.error('Error stopping voice recording:', error);
        }
    };

    const transcribeAudioFile = async (filePath: string) => {
        try {
            if (!whisperContext) {
                console.error('Whisper context not initialized');
                return null;
            }
            const options = { language: 'en' };
            const { stop, promise } =
                whisperContext.transcribe(require('/jfk.wav'), options)
            const { result } = await promise;
            console.log('Transcription result:', result);
            return result;
        } catch (error) {
            console.error('Error transcribing audio:', error);
            return null;
        }
    };


    const onGetTranscript = async () => {
        const audioFilePath = '/jfk.wav';
        const result = await transcribeAudioFile(audioFilePath);
        if (result) {
            setTranscript(result);
        }
        setShowTranscriptButton(false);
        setShowTranscriptTextArea(true);
        setShowGetSentimentButton(true);
    };
    const analyzeSentiment = async (text:string) => {
        try {
            const response = await axios.post(
                'https://language.googleapis.com/v1/documents:analyzeSentiment?key=5zY',
                {
                    document: {
                        type: 'PLAIN_TEXT',
                        content: text,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return null;
        }
    };


    const onGetSentiment = async () => {
        setShowTranscriptButton(false);
        setShowTranscriptTextArea(false);
        setShowGetSentimentButton(false);
        setShowSentimentTextArea(true);
        const analysisResult = await analyzeSentiment(transcript);
        setSentiment(analysisResult);
        console.log('Sentiment analysis result:', analysisResult);
    };

    const onBack = () => {
        setShowSentimentTextArea(false);
        setShowTranscriptTextArea(true);
        setShowGetSentimentButton(true);
    };

    const formatDuration = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <View style={styles.container}>
            {!showSentimentTextArea && (
                <>
                    {!showTranscriptTextArea && (
                        <>
                            <Image
                                source={require('images/w2.png')}
                                style={styles.image}
                            />
                            <Bar progress={audioLevel} width={240} height={20} color="#007bff" />
                            <Text style={[styles.durationText, !isLiveRecording && styles.largeDurationText]}>
                                {formatDuration(duration)}
                            </Text>
                            {isLiveRecording && transcriptionResult ? (
                                <Text style={styles.transcriptText2}>{transcriptionResult}</Text>
                            ) : null}
                            <TouchableOpacity onPress={isLiveRecording ? stopRealTimeRecording : startRealTimeRecording} style={styles.button}>
                                <Text style={styles.buttonText}>{isLiveRecording ? 'Stop Realtime Transcription' : (hasLiveRecorded ? 'Record Again' : 'Start Realtime Transcription')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {!isLive && (
                        <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.button}>
                            <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : (hasRecorded ? 'Record Again' : 'Start Recording')}</Text>
                        </TouchableOpacity>)
                    }
                    {showTranscriptButton && (
                        <TouchableOpacity onPress={onGetTranscript} style={styles.button}>
                            <Text style={styles.buttonText}>Get Transcript</Text>
                        </TouchableOpacity>
                    )}
                    {showTranscriptTextArea && (
                        <TextInput
                            multiline
                            scrollEnabled={true}
                            editable={true}
                            value={transcript || "Transcript will appear here..."}
                            style={styles.textAreaContainer}
                        />
                    )}
                    {showGetSentimentButton && (
                        <TouchableOpacity onPress={onGetSentiment} style={styles.button}>
                            <Text style={styles.buttonText}>Get Sentiment</Text>
                        </TouchableOpacity>
                    )}
                    {showGetSentimentButton && (
                        <TouchableOpacity onPress={() => saveTranscriptWithSentiment(transcript)} style={styles.buttonSave}>
                            <Text style={styles.buttonText}>Save Transcript</Text>
                        </TouchableOpacity>
                    )}
                    {showSavingSuccess && (
                        <View style={styles.savingSuccess}>
                            <Text style={styles.savingSuccessText}>Transcript saved successfully</Text>
                        </View>
                    )}
                </>
            )}
            {showSentimentTextArea && (
                <>
                    <Text style={styles.textAreaContainer2}>
                        {sentiment && sentiment.documentSentiment && sentiment.documentSentiment.score >= 0 ?
                            'Positive Sentiment' :
                            'Negative Sentiment'
                        }
                    </Text>
                    <TouchableOpacity onPress={onBack} style={styles.button}>
                        <Text style={styles.buttonText}>Back</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    textAreaContainer: {
        borderColor: '#007bff',
        borderWidth: 1,
        padding: 10,
        marginTop: 10,
        borderRadius: 13,
        width: '100%',
        maxHeight: 600,
        minHeight: 100,
        color: '#ffffff', // Text color
        textAlignVertical: 'top',
        overflow: 'scroll',
        fontFamily: 'RedHatDisplay-Regular',
        fontSize: 16,

    },
    textAreaContainer2: {
        borderColor: '#007bff',
        borderWidth: 1,
        padding: 10,
        borderRadius: 13,
        width: '80%',
        maxHeight: 100,
        minHeight: 80,
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Bold',
        fontSize: 32,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',

    },
    transcriptText: {
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Regular',
        fontSize: 16,
    },
    transcriptText2: {
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-Regular',
        fontSize: 16,
        marginBottom: 80,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#3D3D3D',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        marginVertical: 5,
        marginTop: 20,
        borderRadius: 15,
        width: 250,
    },
    buttonText: {
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-ExtraBold',
        textAlign: 'center',
        fontSize: 20,
    },
    buttonSave: {
        borderColor: '#007bff', // Border color
        borderWidth: 2, // Border width
        backgroundColor: 'transparent', // Transparent background
        color: '#ffffff',
        fontFamily: 'RedHatDisplay-ExtraBold',
        textAlign: 'center',
        fontSize: 20,
        padding: 10,
        marginVertical: 5,
        marginTop: 15,
        borderRadius: 15,
        width: 250,
    },
    durationText: {
        color: '#ffffff',
        marginVertical: 10,
        fontFamily: 'RedHatDisplay-Bold',
        fontSize: 20,
        marginBottom: 150,
    },
    largeDurationText: {
        fontSize: 30,
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 2,
    },
    savingSuccess: {
        position: 'absolute',
        bottom: 25,
        alignSelf: 'center',
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 13,
        zIndex: 1,
    },
    savingSuccessText: {
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'RedHatDisplay-Bold',
    }
});

export default SpeechToTextScreen;
