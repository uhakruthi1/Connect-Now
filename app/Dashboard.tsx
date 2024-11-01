import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/authContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import UserProfile from '@/components/UserProfile';
import { StackNavigationProp } from '@react-navigation/stack';

interface Friend {
  friendId: string;
  friendEmail: string;
  friendUsername: string;
  friendProfilePhoto: string;
}

type RootStackParamList = {
  PrivateChat: {
    recipientId: string;
    recipientName: string;
    recipientImage: string;
  };
};

type DashboardNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateChat'>;

export default function Dashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>(); 
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'friends'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const friendsList: Friend[] = [];

        for (const friendDoc of querySnapshot.docs) {
          const friendData = friendDoc.data();
          const friendId = friendData.friendId;
          const userProfileDoc = await getDoc(doc(db, 'users', friendId));
          if (userProfileDoc.exists()) {
            const userProfileData = userProfileDoc.data();
            const friendEmail = userProfileData.email;
            const friendUsername = friendEmail.split('@')[0];

            friendsList.push({
              friendId,
              friendEmail,
              friendUsername,
              friendProfilePhoto: userProfileData.profileImage || 'https://via.placeholder.com/50',
            });
          }
        }

        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

  const handleFriendPress = (friendId: string, friendUsername: string, friendProfilePhoto: string) => {
    navigation.navigate('PrivateChat', { 
      recipientId: friendId, 
      recipientName: friendUsername,
      recipientImage: friendProfilePhoto 
    });
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity 
      onPress={() => handleFriendPress(item.friendId, item.friendUsername, item.friendProfilePhoto)}
      style={styles.friendContainer}
    >
      <Image source={{ uri: item.friendProfilePhoto }} style={styles.profilePhoto} />
      <Text style={styles.friendName}>{item.friendUsername || 'Unnamed Friend'}</Text>
    </TouchableOpacity>
  );

  // Filter friends based on search text
  const filteredFriends = friends.filter(friend =>
    friend.friendUsername.toLowerCase().startsWith(searchText.toLowerCase())
  );

  return (
    <ScrollView>
      <UserProfile />
      <View style={styles.container}>
        <Text style={styles.header}>My Friends</Text>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          value={searchText}
          onChangeText={setSearchText}
        />

        {loading ? (
          <ActivityIndicator size="large" color="skyblue" />
        ) : (
          filteredFriends.length === 0 ? (
            <Text>No friends found</Text>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.friendId}
              renderItem={renderFriendItem}
            />
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendName: {
    fontSize: 18,
  },
});
