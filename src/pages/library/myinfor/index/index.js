import utils from '../../utils/utils';
const app = getApp();
Page({
  data: {
    bookItems: [],
    readerInfo: [] // 读者的信息，借阅数目数量和目前欠费的金额
  },
  gotoSearch: utils.gotoSearch,
  setSearchValue: utils.setSearchValue,
  searchIconFocus: utils.searchIconFocus,
  searchIconBlur: utils.searchIconBlur,
  onLoad () {
    let stuInfo = wx.getStorageSync('stuInfo');
    if (!stuInfo) {
      app.gotoLogin();
      return;
    }
    const res = wx.getStorageSync('myinfor_library');
    if (res) {
      this.setData({
        bookItems: res.borrowedBook,
        readerInfo: res.readerInfo
      });
    } else {
      wx.showToast({
        title: '数据加载中...',
        duration: 10000,
        icon: 'loading'
      });
      utils.getBookInfor(this, 'borrowedBook');
    }
  },
  onShareAppMessage () {
    return {
      title: '重邮帮',
      path: '/page/index/index'
    };
  }
});
