
import React, { Component } from 'react';
import { DATES_HEIGHT } from '../const';
import { View, PanResponder, Animated, Dimensions, Easing } from 'react-native';



class Page extends Component {

    constructor(props) {
        super(props);
    }
    renderChildren() {
        return this.props.children;
    }

    render() {
        let pageStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
        };
        if (this.props.right || this.props.left) {
            const space = 200;
            return (
                <Animated.View style={[pageStyle, {
                    elevation: 0,
                    transform: [
                        {
                            translateX: this.props.x.interpolate({
                                inputRange: [-2, -0.1, 0.1, 2],
                                outputRange: [0, space, -space, 0],
                            })
                        }
                    ],
                    opacity: this.props.x.interpolate({
                        inputRange: [-2, -0.1, 0.1, 2],
                        outputRange: [this.props.right ? 1 : 0, 0, 0, this.props.left ? 1 : 0],
                    })
                }]}>
                    {this.renderChildren()}
                </Animated.View>
            );
        }
        return (
            <Animated.View style={[pageStyle, {
                elevation: 1,
                transform: [
                    {
                        translateX: this.props.x.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 50],
                        })
                    }
                ],
                opacity: this.props.x.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0.5, 1, 0.5],
                })
            }]}>
                {this.renderChildren()}
            </Animated.View>
        );
    }
}

class PromisePage extends Page {

    constructor(props) {
        super(props);
        this.props.page.page.update = this.loadRender.bind(this);
        this.state = {
            grayOut: new Animated.Value(1),
        }

    }

    loadRender(force) {
        if (this.promise || !force && this.children !== undefined) {
            if (this.props.slaves) {
                this.props.slaves.forEach((slave) => slave && slave.update && slave.update(force));
            }
            return;
        }
        if (this.props.slaves) {
            Animated.timing(this.state.grayOut, {
                toValue: 0,
                useNativeDriver: true
            }).start();
        }
        return this.promise = this.props.renderContent(this.props.page.page, this.state.grayOut, this.props.toggleManager)
            .then((rendered) => {
                if (rendered === undefined) {
                    rendered = null;
                }
                this.children = rendered;
                this.promise = null;
                this.forceUpdate(() =>
                    Animated.timing(this.state.grayOut, {
                        toValue: 1,
                        useNativeDriver: true
                    }).start());
                console.log("rendered" + this.props.page.page.index);
                if (this.props.slaves) {
                    this.props.slaves.forEach((slave) => slave && slave.update && slave.update(force));
                }
            });
    }

    renderChildren() {
        return this.children;
    }

    render() {
        if (!(this.props.left || this.props.right) && this.children === undefined && !this.promise) {
            this.loadRender();
        }
        return super.render();
    }
}

export default class Swiper extends Component {

    constructor(props) {
        super(props);
        this.setIndex(this.index);
        this.state = {
            x: new Animated.Value(0),
            toggleManager: {
                toggled(untoggle) {
                    if (this.untoggle) {
                        this.untoggle();
                    }
                    this.untoggle = untoggle;
                    return true;
                },

                unToggled() {
                    this.untoggle = null;
                }
            },
        }

        this.panResponder = props.hasPanResponder && PanResponder.create({
            // Ask to be the responder:
            onStartShouldSetPanResponder: (evt, gestureState) => false,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => false,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                return Math.abs(gestureState.dy) < 10 && Math.abs(gestureState.dx) > 10
            },

            onPanResponderGrant: (evt, gestureState) => {
                // The gesture has started. Show visual feedback so the user knows
                // what is happening!
                console.log("onPanResponderGrant");

                // gestureState.d{x,y} will be set to zero now
            },
            onPanResponderMove: (evt, gestureState) => {
                if (this.locked) return false;
                if (Math.abs(gestureState.dx) >= 150 / Math.max(1, Math.abs(gestureState.vx * 0.7))
                    && this.canChangePage(gestureState.dx > 0 ? 1 : -1)) {
                    //this.changePage(gestureState.dx);
                    this.animate(gestureState.dx > 0 ? 1 : -1);
                    return false;
                }
                this.state.x.setValue(gestureState.dx / 200);
            },
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: (evt, gestureState) => {
                // The user has released all touches while this view is the
                // responder. This typically means a gesture has succeeded
                this.locked = false;
                if (!this.anim) {
                    this.anim = Animated.spring(this.state.x, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // Another component has become the responder, so this gesture
                // should be cancelled
                console.log("onPanResponderTerminate");
                this.locked = false;
                if (!this.anim) {
                    this.anim = Animated.spring(this.state.x, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onShouldBlockNativeResponder: (evt, gestureState) => {
                // Returns whether this component should block native components from becoming the JS
                // responder. Returns true by default. Is currently only supported on android.
                console.log("onShouldBlockNativeResponder");
                return false;
            },
        });
    }

    index = 0;
    pages = [];
    masterPage;

    canChangePage(dx) {
        let index = this.index - dx;
        return index >= this.props.minIndex && index <= this.props.maxIndex;
    }

    updateDate(diff) {
        this.animate(diff);
    }

    animate(diff) {
        if (!this.canChangePage(diff)) {
            return;
        }
        this.changePage(diff);
        this.locked = true;
        if (this.anim) {
            return;
        }
        const anim = this.anim = Animated.timing(this.state.x, {
            toValue: diff * 2,
            useNativeDriver: true,
            easing: Easing.bezier(.42, 0, .58, 1)
        });

        this.anim.start(() => {
            if (anim === this.anim) {
                this.state.x.setValue(0);
                this.forceUpdate(() => this.masterPage.update && this.masterPage.update());
                this.anim = null;
            }
        });
    }

    changePage(dx, callback) {
        this.index -= dx;
        this.setIndex(this.index);

    }

    setIndex(index) {
        let newPages = [];
        for (i = Math.max(index - 1, this.props.minIndex); i <= Math.min(index + 1, this.props.maxIndex); i++) {
            if (this.pages[i]) {
                newPages[i] = this.pages[i];
                delete newPages[i].slaves;
            } else {
                newPages[i] = { index: i, date: this.props.startDate.clone().add(i, 'week') };
            }
        }
        this.pages = newPages;
        this.masterPage = newPages[index];
        this.masterPage.slaves = newPages.slice();
        this.masterPage.slaves.splice(index, 1);
    }

    updatePages() {
        this.masterPage.update(true);
    }

    render() {
        let left = this.pages[this.index - 1];
        let right = this.pages[this.index + 1];
        let dateAnimation = this.state.x.interpolate({
            inputRange: [-2, -1, 0, 1, 2],
            outputRange: [-2, -0.5, 0, 0.5, 2]
        });

        const { renderHeaderRow, renderContent } = this.props;
        return (
            <View
                style={{
                    position: 'absolute', height: '100%', width: '100%',
                    backgroundColor: 'transparent'
                }}
                {...(this.panResponder.panHandlers || {})}
                pointerEvents="auto"
            >
                <View style={{ height: DATES_HEIGHT }}>
                    {left &&
                        <Page x={dateAnimation} left key={left.key} page={{ page: left }}>
                            {renderHeaderRow(left)}
                        </Page>
                    }
                    {right &&
                        <Page x={dateAnimation} right key={right.key} page={{ page: right }}>
                            {renderHeaderRow(right)}
                        </Page>
                    }
                    <Page x={dateAnimation}
                        slaves={[left, right]} key={this.masterPage.key} page={{ page: this.masterPage }}>
                        {renderHeaderRow(this.masterPage)}
                    </Page>
                </View>
                <View
                    style={{ flex: 1 }}>
                    {left &&
                        <PromisePage x={this.state.x} left key={left.index} page={{ page: left }} renderContent={renderContent}
                            toggleManager={this.state.toggleManager} />
                    }
                    {right &&
                        <PromisePage x={this.state.x} right key={right.index} page={{ page: right }} renderContent={renderContent}
                            toggleManager={this.state.toggleManager} />
                    }
                    <PromisePage x={this.state.x}
                        slaves={[left, right]}
                        key={this.masterPage.index}
                        toggleManager={this.state.toggleManager}
                        page={{ page: this.masterPage }} renderContent={renderContent} />
                </View>
            </View>
        );
    }
}