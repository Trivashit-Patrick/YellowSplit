import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useDataStore } from '../src/store/dataStore';
import { supabase } from '../src/lib/supabase';
import { Button, Input } from '../src/components/ui';
import { colors, spacing, typography, borderRadius } from '../src/lib/theme';

const EMOJIS = ['🏠', '🍕', '✈️', '💼', '🎮', '🏀', '🎤', '🛒', '☕', '🎉'];

interface FoundUser {
  id: string;
  email: string;
  full_name: string | null;
}

export default function NewGroupScreen() {
  const { user } = useAuthStore();
  const { createGroup } = useDataStore();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [isLoading, setIsLoading] = useState(false);

  const [memberEmail, setMemberEmail] = useState('');
  const [searchingEmail, setSearchingEmail] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [emailError, setEmailError] = useState('');
  const [addedMembers, setAddedMembers] = useState<FoundUser[]>([]);

  const handleSearchEmail = async () => {
    if (!memberEmail.trim()) return;

    if (memberEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('You are already the group creator');
      setFoundUser(null);
      return;
    }

    const alreadyAdded = addedMembers.find(
      m => m.email.toLowerCase() === memberEmail.trim().toLowerCase()
    );
    if (alreadyAdded) {
      setEmailError('This member is already added');
      setFoundUser(null);
      return;
    }

    setSearchingEmail(true);
    setEmailError('');
    setFoundUser(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', memberEmail.trim())
        .single();

      if (error || !data) {
        setEmailError('No user found with this email');
        return;
      }

      const alreadyInList = addedMembers.find(m => m.id === data.id);
      if (alreadyInList) {
        setEmailError('This member is already added');
        return;
      }

      setFoundUser(data);

    } catch (err) {
      setEmailError('Error searching for user');
    } finally {
      setSearchingEmail(false);
    }
  };

  const handleAddMember = () => {
    if (!foundUser) return;
    setAddedMembers(prev => [...prev, foundUser]);
    setFoundUser(null);
    setMemberEmail('');
    setEmailError('');
  };

  const handleRemoveMember = (id: string) => {
    setAddedMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    setIsLoading(true);

    const { error, data } = await createGroup(name.trim(), emoji, user.id);

    if (error) {
      Alert.alert('Error', 'Failed to create group');
      setIsLoading(false);
      return;
    }

    if (data && addedMembers.length > 0) {
      for (const member of addedMembers) {
        await supabase.from('group_members').insert({
          group_id: data.id,
          user_id: member.id,
        });
      }
    }

    setIsLoading(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

          {/* Emoji Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Choose an emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.emojiOption,
                    emoji === e && styles.emojiOptionActive,
                  ]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Group Name */}
          <Input
            label="Group name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Roommates, Trip to Goa"
          />

          {/* Add Members Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Add members by email</Text>

            <View style={styles.emailRow}>
              <View style={{ flex: 1 }}>
                <Input
                  value={memberEmail}
                  onChangeText={(text) => {
                    setMemberEmail(text);
                    setEmailError('');
                    setFoundUser(null);
                  }}
                  placeholder="friend@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearchEmail}
                disabled={searchingEmail || !memberEmail.trim()}
              >
                {searchingEmail ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons name="search" size={20} color={colors.background} />
                )}
              </TouchableOpacity>
            </View>

            {/* Email Error */}
            {emailError ? (
              <View style={styles.errorRow}>
                <Ionicons name="close-circle" size={16} color="#FF4444" />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            ) : null}

            {/* Found User */}
            {foundUser ? (
              <View style={styles.foundUserCard}>
                <View style={styles.foundUserAvatar}>
                  <Text style={styles.foundUserInitials}>
                    {(foundUser.full_name || foundUser.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundUserName}>
                    {foundUser.full_name || 'YellowSplit User'}
                  </Text>
                  <Text style={styles.foundUserEmail}>{foundUser.email}</Text>
                </View>
                <TouchableOpacity style={styles.addMemberBtn} onPress={handleAddMember}>
                  <Ionicons name="add" size={20} color={colors.background} />
                  <Text style={styles.addMemberBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Added Members List */}
            {addedMembers.length > 0 ? (
              <View style={styles.membersList}>
                <Text style={styles.membersListLabel}>
                  Added ({addedMembers.length})
                </Text>
                {addedMembers.map(member => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitials}>
                        {(member.full_name || member.email)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>
                        {member.full_name || 'YellowSplit User'}
                      </Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                      <Ionicons name="close-circle" size={22} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Members must have a YellowSplit account to be added by email.
            </Text>
          </View>

        </ScrollView>

        {/* Create Button */}
        <View style={styles.footer}>
          <Button
            title={addedMembers.length > 0
              ? `Create Group with ${addedMembers.length + 1} members`
              : 'Create Group'}
            onPress={handleCreate}
            loading={isLoading}
            fullWidth
            size="large"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionActive: {
    backgroundColor: colors.primary,
  },
  emojiText: {
    fontSize: 28,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
  },
  foundUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,200,0,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  foundUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundUserInitials: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  foundUserName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  foundUserEmail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: 4,
  },
  addMemberBtnText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  membersList: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  membersListLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  memberName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  memberEmail: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 200, 0, 0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginLeft: spacing.sm,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});