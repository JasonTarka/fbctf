var $ = require('jquery');

function teamNameFormError(details) {
  var $nameField = $('input[name="team_name"]');
  var $inUseError = $('#team_name_error');
  $inUseError.addClass('completely-hidden');

  $nameField.parent().addClass('form-error');
  if (details) {
    $inUseError.children('.details').text(details);
    $inUseError.removeClass('completely-hidden');
  }

  $nameField.on('change', function() {
    $nameField.parent().removeClass('form-error');
  });
}

function teamLoginFormError() {
  $('.el--text')[0].classList.add('form-error');
  $('.el--text')[1].classList.add('form-error');
  $('.fb-form input').on('change', function() {
    $('.el--text')[0].classList.remove('form-error');
    $('.el--text')[1].classList.remove('form-error');
  });
}

function teamPasswordFormError(toosimple) {
  var $passwordError = $('#password_error');
  var $passwordField = $('input[name="password"]').parent('.el--text');
  $passwordField.addClass('form-error');
  if (toosimple) {
    $passwordError.removeClass('completely-hidden');
  }
  $('.fb-form input[name="password"]').on('change', function() {
    $passwordField.removeClass('form-error');
    if (toosimple) {
      $passwordError.addClass('completely-hidden');
    }
  });
}

function teamTokenFormError() {
  var $tokenField = $('input[name="token"]');
  $tokenField.parent('.el--text').addClass('form-error');
  $tokenField.on('change', function() {
    $tokenField.parent('.el--text').removeClass('form-error');
  });
}

function teamLogoFormError() {
  $('.fb-choose-emblem')[0].style.color = 'red';
  $('.fb-choose-emblem').on('click', function() {
    $('.fb-choose-emblem')[0].style.color = '';
  });
}

function verifyTeamName(context) {
  if (context === 'register') {
    var teamName = String($('.fb-form input[name="team_name"]')[0].value);
    if (teamName.length === 0) {
      teamNameFormError();
      return false;
    } else {
      return teamName;
    }
  }
  if (context === 'login') {
    var teamId = $(".fb-form select option:selected")[0].value;
    return teamId;
  }
}

function verifyTeamPassword() {
  var teamPassword = $('.fb-form input[name="password"]')[0].value;
  if (teamPassword.length === 0) {
    teamPasswordFormError();
    return false;
  } else {
    return teamPassword;
  }
}

function verifyTeamLogo(): {isCustom: boolean, type: string, logo: number, error?: any} {
  try {
    // src is filled in by image preview, see fb-ctf.js
    var customLogoSrc = $('#custom-emblem-preview').attr('src');
    if (customLogoSrc) {
      // parse filetype and get base64 data
      // customLogoSrc should be something like data:image/png;base64,AAAFBfj42Pj4...
      var filetypeBeginIdx = customLogoSrc.indexOf('/') + 1;
      var filetypeEndIdx = customLogoSrc.indexOf(';');
      var filetype = customLogoSrc.substring(filetypeBeginIdx, filetypeEndIdx);

      var base64 = customLogoSrc.substring(customLogoSrc.indexOf(',') + 1);

      return {
        isCustom: true,
        type: filetype,
        logo: base64
      };
    }

    var teamLogo = $('.fb-slider .active .icon--badge use').attr('xlink:href').replace('#icon--badge-', '');
    return {
      isCustom: false,
      type: null,
      logo: teamLogo
    };
  } catch (err) {
    teamLogoFormError();
    return {
      isCustom: null,
      type: null,
      logo: null,
      error: err
    };
  }
}

function goToPage(page) {
  switch (page) {
    case 'login':
      window.location.href = '/index.php?page=' + page;
      break;
    default:
      window.location.href = '/index.php?p=' + page;
  }
}

function sendIndexRequest(request_data) {
  $.post(
    'index.php?p=index&ajax=true',
    request_data
  ).fail(function() {
    // TODO: Make this a modal
    console.log('ERROR');
  }).done(function(data) {
    var responseData = JSON.parse(data);
    if (responseData.result === 'OK') {
      console.log('OK:' + responseData.message);
      goToPage(responseData.redirect);
    } else {
      // TODO: Make this a modal
      if (responseData.message === 'Password too simple') {
        teamPasswordFormError(true);
      }
      if (responseData.message === 'Login failed') {
        teamLoginFormError();
      }
      if (responseData.message === 'Registration failed') {
        teamNameFormError(responseData.details);
        teamTokenFormError();
      }
    }
  });
}

module.exports = {
  registerTeam: function() {
    var name = verifyTeamName('register');
    var password = verifyTeamPassword();
    var logoInfo: {isCustom: boolean, type: string, logo: string, error?: any} = verifyTeamLogo();
    var token = '';
    if ($('.fb-form input[name="token"]').length > 0) {
      token = $('.fb-form input[name="token"]')[0].value;
    }

    if (name && password && !logoInfo.error) {
      var register_data = {
        action: 'register_team',
        team_name: name,
        password: password,
        logo: logoInfo.logo,
        isCustomLogo: logoInfo.isCustom,
        logoType: logoInfo.type,
        token: token
      };
      sendIndexRequest(register_data);
    }
  },

  registerNames: function() {
    var name = verifyTeamName('register');
    var password = verifyTeamPassword();
    var logoInfo: {isCustom: boolean, type: string, logo: string, error?: any} = verifyTeamLogo();
    var token = '';
    if ($('.fb-form input[name="token"]').length > 0) {
      token = $('.fb-form input[name="token"]')[0].value;
    }
    var fields = $('.fb-form input[name^="registration_name_"]');
    var names = [];
    $.each(fields, function(index, nameField) {
      names.push(nameField.value);
    });
    var emails = [];
    fields = $('.fb-form input[name^="registration_email_"]');
    $.each(fields, function(index, nameField) {
      emails.push(nameField.value);
    });

    if (name && password && !logoInfo.error) {
      var register_data = {
        action: 'register_names',
        team_name: name,
        password: password,
        logo: logoInfo.logo,
        isCustomLogo: logoInfo.isCustom,
        logoType: logoInfo.type,
        token: token,
        names: JSON.stringify(names),
        emails: JSON.stringify(emails)
      };
      sendIndexRequest(register_data);
    }
  },

  loginTeam: function() {
    var loginSelect = $('.fb-form input[name="login_select"]')[0].value;
    var team, password, teamParam;

    if (loginSelect === 'on') {
      team = verifyTeamName('login');
      teamParam = 'team_id';
    } else {
      team = $('.fb-form input[name="team_name"]')[0].value;
      teamParam = 'team_name';
    }
    password = verifyTeamPassword();

    if (team && password) {
      var login_data = {
        action: 'login_team',
        password: password
      };
      login_data[teamParam] = team;
      sendIndexRequest(login_data);
    }
  },

  loginError: function() {
    $('.fb-form')[0].classList.add('form-error');
  }
};
