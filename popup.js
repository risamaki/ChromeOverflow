$('.btn-toggle').click(function() {
    $(this).find('.btn').toggleClass('active');  
    if ($(this).find('.btn-primary').size()>0) {
      $(this).find('.btn').toggleClass('btn-primary');
    }
    $(this).find('.btn').toggleClass('btn-default');     
});