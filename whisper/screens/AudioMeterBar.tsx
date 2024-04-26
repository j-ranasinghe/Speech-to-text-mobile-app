import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

const AudioMeterBar = () => {
    const [heights, setHeights] = useState<number[]>(Array(200).fill(0));

    useEffect(() => {
        const interval = setInterval(() => {
            const newHeights = heights.map(() => Math.random() * 100);
            setHeights(newHeights);
        }, 30); // Update heights every 200 milliseconds

        return () => clearInterval(interval);
    }, [heights]);

    return (
        <View style={styles.meterContainer}>
            {heights.map((height, index) => (
                <View
                    key={index}
                    style={[styles.bar, { height: `${height}%` }]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    meterContainer: {
        flexDirection: 'row',
        height: 100,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 2,
    },
    bar: {
        backgroundColor: '#007bff',
        width: '14%',
        borderRadius: 5,
    },
});

export default AudioMeterBar;
