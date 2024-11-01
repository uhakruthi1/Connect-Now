import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/authContext';
import { friendRequestRef, db } from '../firebaseConfig';
import { query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export default function MyRequest() {
  const { user } = useAuth(); 
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      setLoading(true);
      try {
        const friendRequestQuery = query(friendRequestRef, where('recipientId', '==', user.uid));
        const snapshot = await getDocs(friendRequestQuery);

        if (snapshot.empty) {
          console.log('No friend requests found');
          setFriendRequests([]); 
          return;
        }

        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFriendRequests(requests);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        alert('Error fetching friend requests: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchFriends = async () => {
      const friendsQuery = query(friendRequestRef, where('status', '==', 'friends'));
      const friendsSnapshot = await getDocs(friendsQuery);
      const friendsData = friendsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendsList(friendsData);
    };

    if (user) {
      fetchFriendRequests();
      fetchFriends(); 
    }
  }, [user]);
  const handleAcceptRequest = async (requestId, senderEmail, senderId) => {
    try {
      // Extract username by removing '@gmail.com' from senderEmail
      const friendUsername = senderEmail.replace(/@gmail\.com$/, '');
  
      // Create or update the friend entry for both users
      await setDoc(doc(db, 'friends', `${user.uid}_${senderId}`), {
        userId: user.uid,
        friendId: senderId,
        friendEmail: senderEmail,
        friendUsername: friendUsername, // Add the friend's username here
      });
  
      const userUsername = user.email.replace(/@gmail\.com$/, ''); // Your username
      await setDoc(doc(db, 'friends', `${senderId}_${user.uid}`), {
        userId: senderId,
        friendId: user.uid,
        friendEmail: user.email,
        friendUsername: userUsername, // Add your username here
      });
  
      // Update the friend request status
      const friendRequestDocRef = doc(friendRequestRef, requestId);
      await setDoc(friendRequestDocRef, { status: 'friends' }, { merge: true });
  
      alert(`Friend request from ${senderEmail} accepted!`);
  
      // Update state for friend requests and friends list
      setFriendRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'friends' } : req
        )
      );
  
      setFriendsList(prevFriends => [
        ...prevFriends,
        { id: senderId, friendEmail: senderEmail, friendUsername: friendUsername } // Add username to the friends list
      ]);
  
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Error accepting friend request: ' + error.message);
    }
  };
  

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Text>{item.senderEmail}</Text>
      {item.status === 'friends' ? (
        <Text style={styles.statusText}>Status: Friends</Text>
      ) : (
        <TouchableOpacity onPress={() => handleAcceptRequest(item.id, item.senderEmail, item.senderId)}>
          <Text style={styles.acceptButton}>Accept Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Text>{item.friendEmail}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <>
          {friendRequests.length === 0 ? (
            <Text>No pending friend requests</Text>
          ) : (
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={renderRequestItem}
            />
          )}
          <Text style={styles.friendsHeader}>Friends</Text>
          {friendsList.length === 0 ? (
            <Text>No friends yet</Text>
          ) : (
            <FlatList
              data={friendsList}
              keyExtractor={(item) => item.id}
              renderItem={renderFriendItem}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  acceptButton: {
    color: 'blue',
  },
  statusText: {
    color: 'green',
    fontWeight: 'bold',
  },
  friendsHeader: {
    fontSize: 20,
    marginVertical: 10,
    fontWeight: 'bold',
  },
  friendItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});
