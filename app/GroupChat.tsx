import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { collection, query, onSnapshot, addDoc, orderBy, Timestamp, where, doc, getDoc } from 'firebase/firestore';
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
  senderName?: string;
}

const GroupChat = () => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = user?.uid;

  const route = useRoute();
  const { groupId, groupTitle } = route.params as { groupId: string; groupTitle: string };

  const soundObject = useRef(new Audio.Sound());

  useEffect(() => {
    const fetchMessages = () => {
      const q = query(
        collection(db, 'groupMessages'),
        where('recipientId', '==', groupId),
        orderBy('timestamp')
      );
  
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const messagesList: Message[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.senderId && data.timestamp) {
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
          setMessages(messagesList);
          setLoading(false);
          scrollToBottom();
        },
        (error) => {
          console.error('Error fetching group messages:', error);
          setLoading(false);
        }
      );
  
      return () => unsubscribe();
    };
  
    fetchMessages();
  }, [groupId]);
  
  useEffect(() => {
    if (messages.length > 0) {
      const fetchSenderNames = async () => {
        try {
          const updatedMessages = await Promise.all(
            messages.map(async (message) => {
              if (message.senderId) {
                const userRef = doc(db, 'users', message.senderId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  message.senderName = message.senderId === currentUserId ? 'You' : userData?.username || message.senderId;
                }
              }
              return message;
            })
          );
          setMessages(updatedMessages);  // Update state with sender names
        } catch (error) {
          console.error("Error fetching sender names:", error);
        }
      };
  
      fetchSenderNames();
    }
  }, [messages, currentUserId]);
  
  const handleSendMessage = async (messageContent?: string, mediaUrl?: string) => {
    if (!messageContent && !mediaUrl) return;

    const newMessage = {
      senderId: currentUserId,
      recipientId: groupId,
      message: messageContent || '',
      mediaUrl: mediaUrl || '',
      timestamp: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, 'groupMessages'), newMessage);
      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handlePlayAudio = async (url: string) => {
    try {
      if (isPlaying === url) {
        await handleStopAudio();
        return;
      }

      await soundObject.current.unloadAsync();
      await soundObject.current.loadAsync({ uri: url });
      await soundObject.current.playAsync();
      setIsPlaying(url);
      soundObject.current.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(null);
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const handleStopAudio = async () => {
    try {
      await soundObject.current.stopAsync();
      setIsPlaying(null);
    } catch (error) {
      console.error("Error stopping audio:", error);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupTitle}>{groupTitle}</Text>
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
            <View
              style={[
                styles.messageContainer,
                item.senderId === currentUserId ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              <Text style={styles.senderName}>
                {item.senderName || (item.senderId === currentUserId ? "You" : item.senderId)}
              </Text>
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
                  {item.mediaUrl.endsWith('.pdf') ? (
                    <Text style={{ color: 'blue' }}>View PDF</Text>
                  ) : item.mediaUrl.endsWith('.mp3') ? (
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
        <TouchableOpacity onPress={() => handleSendMessage(messageText)}>
          <Icon name="send" size={28} color="blue" />
        </TouchableOpacity>
      </View>
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
  groupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34495e',
    textAlign: 'left',
    paddingLeft:20,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  iconButton: {
    marginHorizontal: 8,
  },
  messageContainer: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#e1e8e1',
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#34495e',
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    bottom:20
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
});

export default GroupChat;
