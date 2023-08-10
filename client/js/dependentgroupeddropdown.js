jQuery.entwine("dependentgroupeddropdown", function ($) {

    $(":input.dependent-grouped-dropdown").entwine({
        onmatch: function () {
            var drop = this;
            var fieldName = drop.data('depends').replace(/[#;&,.+*~':"!^$[\]()=>|\/]/g, "\\$&");
            var depends = ($(":input[name=" + fieldName + "]"));
            var dependsTreedropdownfield = ($(".TreeDropdownField[id$=" + fieldName + "]"));

            this.parents('.field:first').addClass('dropdown');

            if (dependsTreedropdownfield.length)
            {
                dependsTreedropdownfield.on('change', function (e) {
                    var newValue = $(":input[name=" + fieldName + "]").val();
                    if (!newValue) {
                        drop.disable(drop.data('unselected'));
                    }
                    else {
                        drop.disable("Loading...");
                        $.get(
                            drop.data('link'),
                            {val: newValue},
                            function (data)
                            {
                                drop.enable();
                                if (drop.data('empty') || drop.data('empty') === "") {
                                    drop.append($("<option />").val("").text(drop.data('empty')));
                                }
                                $.each(data, function ()
                                {
                                    var optGroup = $("<optgroup label=\"" + this.k + "\"></optgroup>");
                                    $.each(this.v, function(k, v) {
                                        optGroup.append(
                                            $("<option value=\"" + k + "\">" + v + "</option>")
                                        );
                                    });
                                    drop.append(optGroup);
                                });
                                drop.trigger("liszt:updated").trigger("chosen:updated").trigger("change");
                            }
                        );
                    }
                });
            }
            else {
                depends.change(function () {
                    if (!this.value) {
                        drop.disable(drop.data('unselected'));
                    } else {
                        drop.disable("Loading...");

                        $.get(drop.data('link'), {
                            val: this.value
                        },
                        function (data) {
                            drop.enable();

                            if (drop.data('empty') || drop.data('empty') === "") {
                                drop.append($("<option />").val("").text(drop.data('empty')));
                            }

                            $.each(data, function () {
                                var optGroup = $("<optgroup label=\"" + this.k + "\"></optgroup>");

                                $.each(this.v, function(k, v) {
                                    optGroup.append(
                                        $("<option value=\"" + k + "\">" + v + "</option>")
                                    );
                                });

                                drop.append(optGroup);
                            });
                            drop.trigger("liszt:updated").trigger("chosen:updated").trigger("change");
                        });
                    }
                });

                if (!depends.val()) {
                    drop.disable(drop.data('unselected'));
                }
            }
        },
        disable: function (text) {
            this.empty().append($("<option />").val("").text(text)).attr("disabled", "disabled").trigger("liszt:updated").trigger("chosen:updated");
        },
        enable: function () {
            this.empty().removeAttr("disabled").next().removeClass('chzn-disabled');
        }
    });

});
