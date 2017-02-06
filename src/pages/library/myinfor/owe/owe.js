import utils from '../../utils/utils';
Page({
  data: {
    title: 'library',
    bookItems: []
  },
  gotoSearch: utils.gotoSearch,
  onLoad () {
    wx.getStorage({
      key: 'myinfor_library',
      success: res => {
        this.setData({
          bookItems: res.data.owedBook
        });
      },
      fail: () => {
        utils.getBookInfor(this, 'owedBook');
      }
    });
  }
});
