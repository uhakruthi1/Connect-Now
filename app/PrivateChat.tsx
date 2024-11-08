import React, { useState, useEffect, useRef } from 'react';
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
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    playsInSilentModeIOS: true, 
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
    playThroughEarpieceAndroid: false,
  });

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
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
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
  
          // Scroll to bottom with a slight delay to ensure FlatList has rendered
          setTimeout(() => scrollToBottom(), 100);
        },
        (error) => {
          console.error('Error fetching messages:', error);
        }
      );
  
      requestAudioPermission();
      return () => unsubscribe();
    };
  
    fetchMessages();
  }, [recipientId, currentUserId]);
  
  // Ensure that scrolling happens each time `messages` updates
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading]);
  

  useEffect(() => {
    if (!loading && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, loading]);

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
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handlePickMedia = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const { uri, name } = result.assets[0];
        const mediaRef = ref(storage, `chat_media/${currentUserId}/${Date.now()}_${name}`);
        const response = await fetch(uri);
        const blob = await response.blob();

        await uploadBytes(mediaRef, blob);
        const downloadUrl = await getDownloadURL(mediaRef);
        handleSendMessage(undefined, downloadUrl);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploading(false);
    }
  };

  const handlePlayAudio = async (uri: string) => {
    if (!uri) return;

    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setIsPlaying(uri);

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await newSound.unloadAsync();
          setIsPlaying(null);
        }
      });

      await newSound.playAsync();
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

  const handleScroll = (event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollOffset = event.nativeEvent.contentOffset.y;
    const visibleHeight = event.nativeEvent.layoutMeasurement.height;

    setIsAtBottom(contentHeight - scrollOffset === visibleHeight);
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <View style={styles.container}>
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
      {loading ? (
        <ActivityIndicator size="large" color="skyblue" />
      ) : (
        <FlatList
          ref={flatListRef}
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
                        handleStopAudio();
                      } else {
                        handlePlayAudio(item.mediaUrl);
                      }
                    }
                  }}
                >
                  {item.mediaUrl.endsWith('.pdf') || item.mediaUrl.includes('.pdf') ? (
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
        />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
        />
       <TouchableOpacity onPress={() => handleSendMessage(messageText)} style={styles.sendButtonContainer}>
         <Icon name="send" size={24} color="blue" />
        </TouchableOpacity>

      </View>
     
        <TouchableOpacity style={styles.scrollButton} onPress={scrollToBottom}>
          <Icon name="keyboard-arrow-down" size={30} color="gray" />
        </TouchableOpacity>
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendName: {
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft:10,
    flex: 1,
  },
  iconButton: {
    marginHorizontal: 5,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: '70%',
  },
  sentMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#e6e6e6',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  timestampText: {
    fontSize: 10,
    color: 'gray',
    alignSelf: 'flex-end',
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    marginBottom:20
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    color: 'blue',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollButton: {
    position: 'absolute',
    right: 10,
    bottom: 90,
    transform: [{ translateX: -185 }],
    borderRadius: 25,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default PrivateChat;
