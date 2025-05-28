// src/screens/NetworkDebugScreen.js
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSettings } from '../store/SettingsContext';
import { Button } from '../components/common/Button';
import { logInfo, logError } from '../utils/logger';

/**
 * Network debug screen component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the screen
 * @returns {React.ReactNode}
 */
export function NetworkDebugScreen({ onClose }) {
  const [log, setLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const { serverUrl } = useSettings();
  
  const addLogEntry = useCallback((message, type = 'info') => {
    setLog(prev => [...prev, { message, type, timestamp: new Date() }]);
  }, []);
  
  const clearLog = useCallback(() => {
    setLog([]);
  }, []);
  
  const runTests = useCallback(async () => {
    setIsRunning(true);
    clearLog();
    
    try {
      // Check device connectivity
      addLogEntry('Checking device connectivity...');
      const info = await NetInfo.fetch();
      addLogEntry(`📶 ${info.type} / connected=${info.isConnected}`);
      
      // Test API connection
      addLogEntry('Testing API connection...');
      const apiEndpoint = serverUrl || 'https://home.andrewrsweeney.com/notes';
      const startTime = Date.now();
      
      try {
        const response = await fetch(apiEndpoint);
        const elapsed = Date.now() - startTime;
        
        if (response.ok) {
          addLogEntry(`✅ ${response.status} ${response.statusText || ''} (${elapsed} ms)`);
          
          // Try to parse response
          try {
            const data = await response.json();
            addLogEntry(`📄 Received ${Array.isArray(data) ? data.length : 'unknown'} items`);
          } catch (parseError) {
            addLogEntry(`⚠️ Could not parse response: ${parseError.message}`, 'warning');
          }
        } else {
          addLogEntry(`⚠️ API returned error: ${response.status} ${response.statusText || ''}`, 'warning');
        }
      } catch (fetchError) {
        addLogEntry(`❌ Fetch error: ${fetchError.message}`, 'error');
      }
      
      addLogEntry('ℹ️ Check adb / Xcode logs for SSL or policy errors');
      
    } catch (error) {
      addLogEntry(`❌ Test failed: ${error.message}`, 'error');
      logError('Network test error:', error);
    } finally {
      setIsRunning(false);
    }
  }, [serverUrl, addLogEntry, clearLog]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Diagnostics</Text>
      
      <View style={styles.buttonRow}>
        <Button 
          title={isRunning ? "Running Tests..." : "Run Network Tests"} 
          onPress={runTests}
          disabled={isRunning}
          style={styles.button}
        />
        
        <Button 
          title="Clear Log" 
          onPress={clearLog}
          variant="secondary"
          style={styles.button}
          disabled={log.length === 0}
        />
      </View>
      
      <ScrollView style={styles.logContainer}>
        {log.length === 0 ? (
          <Text style={styles.emptyLog}>No log entries yet. Run tests to see results.</Text>
        ) : (
          log.map((entry, index) => (
            <Text 
              key={index} 
              style={[
                styles.logEntry,
                entry.type === 'error' && styles.errorEntry,
                entry.type === 'warning' && styles.warningEntry,
              ]}
            >
              {entry.message}
            </Text>
          ))
        )}
      </ScrollView>
      
      <Button 
        title="Close" 
        onPress={onClose}
        variant="secondary"
        style={styles.closeButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    marginRight: 8,
  },
  logContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  logEntry: {
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 8,
  },
  errorEntry: {
    color: '#cc0000',
  },
  warningEntry: {
    color: '#cc6600',
  },
  emptyLog: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 16,
  },
});

export default NetworkDebugScreen;
