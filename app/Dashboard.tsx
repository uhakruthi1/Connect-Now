import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/authContext';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import UserProfile from '@/components/UserProfile';
import { StackNavigationProp } from '@react-navigation/stack';

interface Friend {
  friendId: string;
  friendEmail: string;
  friendUsername: string;
  friendProfilePhoto: string;
  friendStatus: string;
}

interface Group {
  groupId: string;
  groupTitle: string;
  groupCreatorId: string;
}

type RootStackParamList = {
  PrivateChat: { recipientId: string; recipientName: string; recipientImage: string };
  GroupChat: { groupId: string; groupTitle: string };
};

type DashboardNavigationProp = StackNavigationProp<RootStackParamList, 'PrivateChat'>;

export default function Dashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchFriendsAndGroups = async () => {
      setLoading(true);
      try {
        const friendsList: Friend[] = [];
        const friendsQuery = query(collection(db, 'friends'), where('userId', '==', user.uid));
        const friendsSnapshot = await getDocs(friendsQuery);

        for (const friendDoc of friendsSnapshot.docs) {
          const friendData = friendDoc.data();
          const friendId = friendData.friendId;
          const userProfileDoc = await getDoc(doc(db, 'users', friendId));
          if (userProfileDoc.exists()) {
            const userProfileData = userProfileDoc.data();
            const friendEmail = userProfileData.email;
            const friendUsername = friendEmail.split('@')[0];
            const friendStatus = userProfileData.status;

            friendsList.push({
              friendId,
              friendEmail,
              friendUsername,
              friendProfilePhoto: userProfileData.profileImage || 'https://via.placeholder.com/50',
              friendStatus,
            });
          }
        }
        setFriends(friendsList);

        const memberGroupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
        const memberGroupsSnapshot = await getDocs(memberGroupsQuery);

        const allGroups: Group[] = [
          ...memberGroupsSnapshot.docs.map(groupDoc => ({
            groupId: groupDoc.id,
            groupTitle: groupDoc.data().title,
            groupCreatorId: groupDoc.data().creatorId,
          })),
          ...(
            await getDocs(query(collection(db, 'groups'), where('creatorId', '==', user.uid)))
          ).docs.map(groupDoc => ({
            groupId: groupDoc.id,
            groupTitle: groupDoc.data().title,
            groupCreatorId: groupDoc.data().creatorId,
          })),
        ];

        const uniqueGroups = Array.from(new Map(allGroups.map(g => [g.groupId, g])).values());
        setGroups(uniqueGroups);
      } catch (error) {
        console.error('Error fetching friends and groups:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchFriendsAndGroups();
  }, [user]);

  const handleFriendPress = (friendId: string, friendUsername: string, friendProfilePhoto: string) => {
    navigation.navigate('PrivateChat', { recipientId: friendId, recipientName: friendUsername, recipientImage: friendProfilePhoto });
  };

  const handleGroupPress = (groupId: string, groupTitle: string) => {
    navigation.navigate('GroupChat', { groupId, groupTitle });
  };

  const handleCreateGroup = async () => {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      const currentUserUsername = currentUserDoc.exists() ? currentUserDoc.data().email.split('@')[0] : 'Unnamed User';
      const selectedFriendNames = selectedFriends.map(friend => friend.friendUsername);

      const groupDocRef = await addDoc(collection(db, 'groups'), {
        title: groupTitle,
        creatorId: user.uid,
        members: selectedFriends.map(friend => friend.friendId),
        memberNames: [currentUserUsername, ...selectedFriendNames],
        createdAt: new Date(),
      });

      console.log('Group created with ID:', groupDocRef.id);
      setShowModal(false);
      navigation.navigate('GroupChat', { groupId: groupDocRef.id, groupTitle });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const filteredFriends = friends.filter(friend => friend.friendUsername.toLowerCase().startsWith(searchText.toLowerCase()));

  return (
    <ScrollView>
      <UserProfile />
      <View style={styles.container}>
        <Text style={styles.header}>My Friends</Text>
        <TextInput style={styles.searchInput} placeholder="Search friends..." value={searchText} onChangeText={setSearchText} />
        {loading ? (
          <ActivityIndicator size="large" color="skyblue" />
        ) : filteredFriends.length === 0 ? (
          <Text>No friends found</Text>
        ) : (
          <FlatList data={filteredFriends} keyExtractor={(item) => item.friendId} renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleFriendPress(item.friendId, item.friendUsername, item.friendProfilePhoto)} style={[styles.friendContainer, { backgroundColor: item.friendStatus === 'online' ? '#99CC66' : '#D3D3D3' }]}>
              <Image source={{ uri: item.friendProfilePhoto }} style={styles.profilePhoto} />
              <Text style={styles.friendName}>{item.friendUsername || 'Unnamed Friend'}</Text>
            </TouchableOpacity>
          )} />
        )}

        <Text style={styles.header}>My Groups</Text>
        {loading ? (
          <ActivityIndicator size="large" color="skyblue" />
        ) : groups.length === 0 ? (
          <Text>No groups found</Text>
        ) : (
          <FlatList data={groups} keyExtractor={(item) => item.groupId} renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleGroupPress(item.groupId, item.groupTitle)} style={styles.friendContainer}>
              <Text style={styles.friendName}>{item.groupTitle}</Text>
            </TouchableOpacity>
          )} />
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent={true} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TextInput style={styles.groupTitleInput} placeholder="Enter group title" value={groupTitle} onChangeText={setGroupTitle} />
            <Text style={styles.modalTitle}>Search Friends</Text>
            <FlatList data={filteredFriends} keyExtractor={(item) => item.friendId} renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedFriends(prev => prev.includes(item) ? prev : [...prev, item])} style={styles.friendContainer}>
                <Image source={{ uri: item.friendProfilePhoto }} style={styles.profilePhoto} />
                <Text style={styles.friendName}>{item.friendUsername}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
              <Text style={styles.createGroupText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  searchInput: { borderWidth: 1, padding: 8, marginBottom: 10, borderRadius: 5, fontSize: 16 },
  friendContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  profilePhoto: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  friendName: { fontSize: 18, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  fabText: { color: 'white', fontSize: 30 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  groupTitleInput: { borderWidth: 1, padding: 8, marginBottom: 10, borderRadius: 5, fontSize: 16 },
  createGroupButton: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 5, alignItems: 'center', marginVertical: 5 },
  createGroupText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { padding: 12, alignItems: 'center', marginVertical: 5 },
  cancelText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
});
