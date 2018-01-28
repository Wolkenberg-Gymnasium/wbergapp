import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    row: {
        flexDirection: 'row',
    },
    column: {
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
    },
    cell: {
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: '#212121',
        backgroundColor: '#212121',
        flex: 1,
    },
    headerColumn: {
        flex: 0,
        
    },
    holiday: {
    },
    grid: {
        flexDirection: 'row',
        flex: 1,
        height: '100%',
    },
    headerCell: {
        paddingHorizontal: 10,
        justifyContent: 'center',
        flex: 1,
        backgroundColor: '#212121',
        alignItems: 'center',
        width: 40,
    },
    weekday: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#cccccc'
    },

    headerRowCell: {
        padding: 5,
        justifyContent: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
    },

    period: {
        color: 'white'
    },

    time: {
        fontSize: 7,
        color: 'white'
    },
    
    accent: {
        backgroundColor: '#1b1b1b'
    },

    container: {
        flex: 1,
    },
    periodNumbers: {
        alignItems: 'center',

        flexDirection: 'column',
    }
});
