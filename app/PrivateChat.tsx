import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { collection, query, onSnapshot, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/authContext'; 

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: Timestamp;
}

const PrivateChat = () => {
  const { user } = useAuth(); 
  const [messageText, setMessageText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const route = useRoute();
  const { recipientId, recipientName, recipientImage } = route.params as { recipientId: string; recipientName: string; recipientImage: string };
  const currentUserId = user?.uid; 

  useEffect(() => {
    const fetchMessages = async () => {
      const q = query(
        collection(db, 'messages'),
        orderBy('timestamp') 
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesList: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure all required fields are present
          if (data.senderId && data.recipientId && data.message && data.timestamp) {
            messagesList.push({
              id: doc.id,
              senderId: data.senderId,
              recipientId: data.recipientId,
              message: data.message,
              timestamp: data.timestamp,
            });
          } else {
            console.error("Missing fields in message document:", doc.id, data);
          }
        });

        console.log("All Messages: ", messagesList); // Debug output

        // Filter messages for current user and recipient
        const filteredMessages = messagesList.filter((msg) => 
          (msg.senderId === currentUserId && msg.recipientId === recipientId) ||  
          (msg.senderId === recipientId && msg.recipientId === currentUserId)    
        );

        console.log("Filtered Messages: ", filteredMessages); 
        setMessages(filteredMessages);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
      });

      return () => unsubscribe();
    };

    fetchMessages();
  }, [recipientId, currentUserId]);

  const sendMessage = async () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: '',
        senderId: currentUserId,
        recipientId: recipientId,
        message: messageText,
        timestamp: Timestamp.now(),
      };

      try {
        await addDoc(collection(db, 'messages'), newMessage);
        setMessageText('');
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: recipientImage }} 
          style={styles.profileImage}
        />
        <Text style={styles.friendName}>{recipientName.split('@')[0]}</Text>
        <TouchableOpacity style={styles.iconButton}>
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
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.messageContainer,
              item.senderId === currentUserId ? styles.sentMessage : styles.receivedMessage
            ]}>
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.timestampText}>{item.timestamp.toDate().toLocaleTimeString()}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyChatText}>No messages yet.</Text>}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={messageText}
          onChangeText={setMessageText}
          onSubmitEditing={sendMessage}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginBottom: 50,
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    height: 40,
  },
  iconButton: {
    paddingHorizontal: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
    marginVertical: 5,
    alignSelf: 'flex-start',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007aff',
    color: '#fff',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestampText: {
    fontSize: 10,
    color: 'gray',
    alignSelf: 'flex-end',
  },
  emptyChatText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 20,
  },
});

export default PrivateChat;
