import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { collection, query, onSnapshot, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { db } from '@/firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/authContext';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  message?: string;
  mediaUrl?: string;
  timestamp: Timestamp;
}

const PrivateChat = () => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const route = useRoute();
  const { recipientId, recipientName, recipientImage } = route.params as { recipientId: string; recipientName: string; recipientImage: string };
  const currentUserId = user?.uid;
  const storage = getStorage();

  const requestAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Audio permission not granted');
      }
    } catch (error) {
      console.error('Error requesting audio permission:', error);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const q = query(collection(db, 'messages'), orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesList: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.senderId && data.recipientId && data.timestamp) {
            messagesList.push({
              id: doc.id,
              senderId: data.senderId,
              recipientId: data.recipientId,
              message: data.message,
              mediaUrl: data.mediaUrl,
              timestamp: data.timestamp,
            });
          }
        });

        const filteredMessages = messagesList.filter((msg) =>
          (msg.senderId === currentUserId && msg.recipientId === recipientId) ||
          (msg.senderId === recipientId && msg.recipientId === currentUserId)
        );

        setMessages(filteredMessages);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
      });
      requestAudioPermission();
      return () => unsubscribe();
    };

    fetchMessages();
  }, [recipientId, currentUserId]);

  const handleSendMessage = async (messageContent?: string, mediaUrl?: string) => {
    if (!messageContent && !mediaUrl) return;

    const newMessage: Message = {
      id: '',
      senderId: currentUserId,
      recipientId: recipientId,
      message: messageContent || '',
      mediaUrl: mediaUrl || '',
      timestamp: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, 'messages'), newMessage);
      setMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handlePickMedia = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

      if (result.canceled) {
        console.log('Document picker was canceled.');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const { uri, name } = result.assets[0];
        const mediaRef = ref(storage, `chat_media/${currentUserId}/${Date.now()}_${name}`);
        const response = await fetch(uri);
        const blob = await response.blob();

        await uploadBytes(mediaRef, blob);
        const downloadUrl = await getDownloadURL(mediaRef);
        handleSendMessage(undefined, downloadUrl);
      } else {
        console.log('No valid assets found.');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploading(false);
    }
  };

  const handlePlayAudio = async (uri: string) => {
    console.log("Attempting to play audio from URI:", uri);
  
    if (!uri) {
      console.error("No audio URI provided.");
      return;
    }
  
    try {
      // Stop and unload any currently playing sound
      if (sound) {
        await sound.stopAsync(); 
        await sound.unloadAsync(); 
      }
  
      // Load the new sound
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setIsPlaying(uri);
  
      // Set up the playback status update listener
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        console.log("Playback status:", status);
        if (status.didJustFinish) {
          await newSound.unloadAsync(); // Unload the sound when it finishes playing
          setIsPlaying(null);
        }
      });
  
      // Play the sound
      await newSound.playAsync();
      console.log("Audio is playing");
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const handleStopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(null);
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Image source={{ uri: recipientImage }} style={styles.profileImage} />
      <Text style={styles.friendName}>{recipientName.split('@')[0]}</Text>
      <TouchableOpacity style={styles.iconButton} onPress={handlePickMedia}>
        <Icon name="attach-file" size={30} color="gray" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Icon name="call" size={30} color="gray" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="skyblue" />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.messageContainer,
              item.senderId === currentUserId ? styles.sentMessage : styles.receivedMessage
            ]}>
              {item.message && <Text style={styles.messageText}>{item.message}</Text>}
              {item.mediaUrl && (
                <TouchableOpacity
                  onPress={() => {
                    if (item.mediaUrl) {
                      if (isPlaying === item.mediaUrl) {
                        handleStopAudio(); // Stop if already playing
                      } else {
                        handlePlayAudio(item.mediaUrl); // Play audio
                      }
                    }
                  }}
                >
                  {item.mediaUrl.endsWith('.pdf') ? (
                    <Text style={{ color: 'blue' }}>View PDF</Text>
                  ) : item.mediaUrl.endsWith('.mp3') || item.mediaUrl.includes('.mp3') ? (
                    <Text style={{ color: 'blue' }}>{isPlaying === item.mediaUrl ? 'Stop Audio' : 'Play Audio'}</Text>
                  ) : (
                    <Image source={{ uri: item.mediaUrl }} style={styles.media} />
                  )}
                </TouchableOpacity>
              )}
              <Text style={styles.timestampText}>{item.timestamp.toDate().toLocaleTimeString()}</Text>
            </View>
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<Text style={styles.emptyChatText}>No messages yet.</Text>}
        />
      )}

      {uploading && <ActivityIndicator size="small" color="blue" />}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={() => handleSendMessage(messageText)}
        />
        <Button title="Send" onPress={() => handleSendMessage(messageText)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  iconButton: {
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
  },
  messageContainer: {
    marginVertical: 5,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 5,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#cce5ff',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e3e5',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  timestampText: {
    fontSize: 12,
    color: 'gray',
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  emptyChatText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },
});

export default PrivateChat;
