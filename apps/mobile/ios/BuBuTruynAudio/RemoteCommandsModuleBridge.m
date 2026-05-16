#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <MediaPlayer/MediaPlayer.h>

@interface RemoteCommandsModule : RCTEventEmitter <RCTBridgeModule> {
  BOOL _hasListeners;
}
@end

@implementation RemoteCommandsModule

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onNextTrack", @"onPreviousTrack"];
}

- (void)startObserving { _hasListeners = YES; }
- (void)stopObserving  { _hasListeners = NO; }

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(enable) {
  MPRemoteCommandCenter *cc = [MPRemoteCommandCenter sharedCommandCenter];
  // Remove previous targets to avoid duplicates on re-enable
  [cc.nextTrackCommand removeTarget:nil];
  [cc.previousTrackCommand removeTarget:nil];

  cc.nextTrackCommand.enabled = YES;
  __weak typeof(self) weakSelf = self;
  [cc.nextTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *e) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf && strongSelf->_hasListeners)
      [strongSelf sendEventWithName:@"onNextTrack" body:nil];
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  cc.previousTrackCommand.enabled = YES;
  [cc.previousTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *e) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf && strongSelf->_hasListeners)
      [strongSelf sendEventWithName:@"onPreviousTrack" body:nil];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
}

RCT_EXPORT_METHOD(disable) {
  MPRemoteCommandCenter *cc = [MPRemoteCommandCenter sharedCommandCenter];
  cc.nextTrackCommand.enabled = NO;
  [cc.nextTrackCommand removeTarget:nil];
  cc.previousTrackCommand.enabled = NO;
  [cc.previousTrackCommand removeTarget:nil];
}

@end
