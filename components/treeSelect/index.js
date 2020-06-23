import React, { Component } from 'react';
import { StyleSheet, PixelRatio, View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { breadthFirstRecursion } from '../utils/menutransform';

export default class TreeSelect extends Component {
  constructor(props) {
    super(props);
    this.routes = [];
    this.state = {
      nodesStatus: this._initNodesStatus(),
      currentNode: this._initCurrentNode(),
      currentRoot: '',
      searchValue: ''
    };
  }

  _initCurrentNode = () => {
    const { defaultSelectedId, selectType } = this.props;
    if (selectType === 'multiple') {
      return defaultSelectedId || [];
    }
    return defaultSelectedId && defaultSelectedId[0] || null;
  };

  _initNodesStatus = () => {
    const { isOpen = false, data, openIds = [], defaultSelectedId = [] } = this.props;
    const nodesStatus = new Map();
    if (!isOpen) {
      if (openIds && openIds.length) {
        for (let id of openIds) { // eslint-disable-line
          const routes = this._find(data, id);
          routes.map(parent => nodesStatus.set(parent.id, true));
        }
      }
      // 设置默认选中时父节点的展开操作
      if (defaultSelectedId && defaultSelectedId.length) {
        for (let id of defaultSelectedId) { // eslint-disable-line
          const routes = this._find(data, id);
          routes.map(parent => nodesStatus.set(parent.id, true));
        }
      }
      return nodesStatus;
    }
    breadthFirstRecursion(data).map(item => nodesStatus.set(item.id, true));
    return nodesStatus;
  };

  _find = (data, id) => {
    const stack = [];
    let going = true;

    const walker = (childrenData, innerId) => {
      childrenData.forEach(item => {
        if (!going) return;
        stack.push({
          id: item.id,
          name: item.name,
          parentId: item.parentId
        });
        if (item['id'] === innerId) {
          going = false;
        } else if (item['children']) {
          walker(item['children'], innerId);
        } else {
          stack.pop();
        }
      });
      if (going) stack.pop();
    };

    walker(data, id);
    return stack;
  };

  _onPressCollapse(item) {
    const { data, selectType, leafCanBeSelected } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, item.id);
    this.setState((state) => {
      const nodesStatus = new Map(state.nodesStatus);
      if (nodesStatus.has(item && item.id)) {
        nodesStatus.set(item && item.id, !nodesStatus.get(item && item.id));
      } else {
        nodesStatus.set(item && item.id, true);
      }

      const dataArray = data && data.map((item) => item.id);
      nodesStatus.forEach(function (value, key, map) {
        if (key !== item.id && dataArray.includes(item.id)) {
          nodesStatus.set(key, false); // toggle
        }
      });

      // nodesStatus.set(item && item.id, !nodesStatus.get(item && item.id)); // toggle

      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(item.id) ?
          currentNode.filter(nodeid => nodeid !== item.id) : currentNode.concat(item.id)
        if (leafCanBeSelected) {
          return { nodesStatus };
        }
        return { currentNode: tempCurrentNode, nodesStatus };
      } else {
        if (leafCanBeSelected) {
          return { nodesStatus };
        }
        return { currentNode: item.id, nodesStatus };
      }
    }, () => {
      const { onClick } = this.props;
      onClick && onClick({ item, routes, currentNode: this.state.currentNode });
    });
  };

  _onClickLeaf(item) { // eslint-disable-line
    const { selectType } = this.props;
    const { data } = this.props;
    const { currentNode } = this.state;
    const routes = this._find(data, item.id);
    this.setState((state) => {
      // 计算currentNode的内容
      if (selectType === 'multiple') {
        const tempCurrentNode = currentNode.includes(item.id) ?
          currentNode.filter(nodeid => nodeid !== item.id) : currentNode.concat(item.id)
        return {
          currentNode: tempCurrentNode,
        };
      } else {
        return {
          currentNode: item.id
        };
      }
    }, () => {
      const { onClickLeaf } = this.props;
      onClickLeaf && onClickLeaf({ item, routes, currentNode: this.state.currentNode });
    });
  };

  _renderTreeNodeIcon = (isOpen) => {
    const { isShowTreeId = false, selectedItemStyle, itemStyle, treeNodeStyle } = this.props;
    const collapseIcon = isOpen ? {
      borderRightWidth: 5,
      borderRightColor: 'transparent',
      borderLeftWidth: 5,
      borderLeftColor: 'transparent',
      borderTopWidth: 10,
      borderTopColor: 'black',
    } : {
        borderBottomWidth: 5,
        borderBottomColor: 'transparent',
        borderTopWidth: 5,
        borderTopColor: 'transparent',
        borderLeftWidth: 10,
        borderLeftColor: 'black',
      };
    const openIcon = treeNodeStyle && treeNodeStyle.openIcon;
    const closeIcon = treeNodeStyle && treeNodeStyle.closeIcon;

    return openIcon && closeIcon ? <View>{isOpen ? openIcon : closeIcon}</View> :
      <View style={[styles.collapseIcon, collapseIcon]} />;
  };

  _renderRow = ({ item }) => {
    const { currentNode } = this.state;
    const { isShowTreeId = false, selectedItemStyle, itemStyle, treeNodeStyle, selectType = 'single', leafCanBeSelected } = this.props;
    const { backgroundColor, fontSize, color } = itemStyle && itemStyle;
    const itemIcon = treeNodeStyle && treeNodeStyle.itemIcon;
    const organizationIcon = treeNodeStyle && treeNodeStyle.organizationIcon;
    const checkedIcon = treeNodeStyle && treeNodeStyle.checkedIcon;

    const selectedBackgroudColor = selectedItemStyle && selectedItemStyle.backgroundColor;
    const selectedFontSize = selectedItemStyle && selectedItemStyle.fontSize;
    const selectedColor = selectedItemStyle && selectedItemStyle.color;
    const isCurrentNode = selectType === 'multiple' ? currentNode.includes(item.id) : (currentNode === item.id);

    if (item && item.children && item.children.length) {
      const isOpen = this.state.nodesStatus && this.state.nodesStatus.get(item && item.id) || false;
      return (
        <View>
          <TouchableOpacity activeOpacity={1} onPress={this._onPressCollapse.bind(this, item)} >
            <View style={{
              flexDirection: 'row',
              backgroundColor: !leafCanBeSelected && isCurrentNode ? selectedBackgroudColor || '#FFEDCE' : backgroundColor || '#fff',
              height: 55,
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomColor: '#D3D3D3',
              borderBottomWidth: 0.6
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {this._renderTreeNodeIcon(isOpen)}
                {
                  isShowTreeId && <Text style={{ fontSize: 14, marginLeft: 4 }}>{item.id}</Text>
                }
                {organizationIcon ? organizationIcon : null}
                <Text style={[styles.textName, !leafCanBeSelected && isCurrentNode ? { fontSize: selectedFontSize, color: selectedColor } : { fontSize, color }]}>{item.name}</Text>
              </View>
              {isCurrentNode && checkedIcon ? checkedIcon : <View />}

            </View>
          </TouchableOpacity>
          {
            !isOpen ? null :
              <FlatList
                keyExtractor={(childrenItem, i) => i.toString()}
                style={{ flex: 1, marginLeft: 15 }}
                onEndReachedThreshold={0.01}
                {...this.props}
                data={item.children}
                extraData={this.state}
                renderItem={this._renderRow}
              />
          }
        </View>
      );
    }

    return (
      <TouchableOpacity activeOpacity={1} onPress={this._onClickLeaf.bind(this, item)}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: isCurrentNode ? selectedBackgroudColor || '#FFEDCE' : backgroundColor || '#fff',
          height: 55,
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomColor: '#D3D3D3',
          borderBottomWidth: 0.6
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            {itemIcon ? itemIcon : null}
            <Text style={[styles.textName, isCurrentNode ? { fontSize: selectedFontSize, color: selectedColor } : { fontSize, color }]}>{item.name}</Text>
          </View>
          {isCurrentNode && checkedIcon ? checkedIcon : <View />}
        </View>
      </TouchableOpacity >
    );
  };

  _onSearch = () => {
    const { searchValue } = this.state;

  };

  _onChangeText = (key, value) => {
    this.setState({
      [key]: value
    });
  };

  _renderSearchBar = () => {
    const { searchValue } = this.state;
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 5,
        borderColor: '#555', marginHorizontal: 10,
      }}>
        <TextInput
          style={{ height: 38, paddingHorizontal: 5, flex: 1 }}
          value={searchValue}
          autoCapitalize="none"
          underlineColorAndroid="transparent"
          autoCorrect={false}
          blurOnSubmit
          clearButtonMode="while-editing"
          placeholder="搜索节点"
          placeholderTextColor="#e9e5e1"
          onChangeText={(text) => this._onChangeText('searchValue', text)}
        />
        <TouchableOpacity activeOpacity={1} onPress={this._onSearch}>
          <Ionicons name="ios-search" style={{ fontSize: 25, marginHorizontal: 5 }} />
        </TouchableOpacity>
      </View >
    );
  }

  render() {
    const { data } = this.props;
    return (
      <View style={styles.container}>
        {/*{*/}
        {/*this._renderSearchBar()*/}
        {/*}*/}
        <FlatList
          keyExtractor={(item, i) => i.toString()}
          style={{ flex: 1, marginVertical: 5, paddingHorizontal: 15 }}
          onEndReachedThreshold={0.01}
          {...this.props}
          data={data}
          extraData={this.state}
          renderItem={this._renderRow}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  textName: {
    fontSize: 14,
    marginLeft: 5
  },
  contentContainer: {
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  collapseIcon: {
    width: 0,
    height: 0,
    marginRight: 2,
    borderStyle: 'solid',
  }
});
