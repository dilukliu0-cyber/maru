import { Component, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Чтобы приложение не падало целиком: показываем ошибку на экране.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const e = this.state.error;
    if (!e) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 80, paddingHorizontal: 22 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Что-то сломалось</Text>
        <Text style={{ color: '#9b9b97', marginTop: 6 }}>Данные не потеряны. Покажи этот текст разработчику.</Text>
        <ScrollView style={{ marginTop: 16, maxHeight: 360 }}>
          <Text selectable style={{ color: '#ddd', fontFamily: 'Menlo', fontSize: 12 }}>
            {String(e.message)}
            {'\n\n'}
            {e.stack}
          </Text>
        </ScrollView>
        <Pressable onPress={() => this.setState({ error: null })} style={{ marginTop: 20, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ color: '#000', fontWeight: '600' }}>Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }
}
