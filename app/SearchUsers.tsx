import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/authContext';
import { userRef, friendRequestRef } from '../firebaseConfig'; 
import { query, where, getDocs, addDoc } from 'firebase/firestore'; 


interface User {
  id: string;
  email: string;
}

export default function SearchUsers() {
  const { user } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]); 
  const [loading, setLoading] = useState<boolean>(false);
  

  interface RequestStatus {
    [key: string]: 'pending' | 'sent' | undefined; 
  }

  const [requestStatus, setRequestStatus] = useState<RequestStatus>({}); 

 
  useEffect(() => {
    const fetchFriendRequests = async () => {
      const friendRequestQuery = query(friendRequestRef, where('senderId', '==', user.uid));
      const snapshot = await getDocs(friendRequestQuery);
      const sentRequests = snapshot.docs.map(doc => doc.data().recipientId);
      setRequestStatus(prevStatus => {
        const updatedStatus: RequestStatus = { ...prevStatus };
        sentRequests.forEach(id => {
          updatedStatus[id] = 'sent'; 
        });
        return updatedStatus;
      });
    };

    fetchFriendRequests();
  }, [user.uid]);

  const handleSearch = async () => {
    setLoading(true);
    setSearchResults([]); 
    try {
      
      const userQuery = query(userRef, where('email', '==', email.toLowerCase())); 
      const snapshot = await getDocs(userQuery);

      console.log('Query snapshot:', snapshot);

      if (snapshot.empty) {
        alert('No users found with that email.');
        return;
      }

      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[]; 
      console.log('Search results:', results); 
      setSearchResults(results);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (recipientId: string, recipientEmail: string) => {
   
    if (requestStatus[recipientId] === 'pending' || requestStatus[recipientId] === 'sent'||requestStatus[user.uid] === 'pending' || requestStatus[user.uid] === 'sent') {
      alert('Friend request already sent!');
      return;
    }

    try {
      await addDoc(friendRequestRef, {
        senderId: user.uid, 
        senderEmail: user.email, 
        recipientId,
        recipientEmail,
        status: 'pending',
      });
      alert('Friend request sent!');
      
      setRequestStatus(prevStatus => ({
        ...prevStatus,
        [recipientId]: 'sent',
      }));
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Error sending friend request: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter email ID"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Search" onPress={handleSearch} disabled={loading} />

      {loading && <Text>Loading...</Text>}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text>{item.email}</Text>
           
            {requestStatus[item.id] !== 'sent' ? (
              <TouchableOpacity 
                onPress={() => handleSendRequest(item.id, item.email)} 
                disabled={requestStatus[item.id] === 'pending'}
              >
                <Text style={styles.requestButton}>Send Request</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.pendingButton}>Request Sent</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  requestButton: {
    color: 'blue',
  },
  pendingButton: {
    color: 'orange',
  },
});
