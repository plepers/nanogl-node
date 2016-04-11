var Node     = require( '../node' );
var equalish = require( './equalish' );

var glmat = require( 'gl-matrix' );

var expect = require( 'expect.js' ),
    sinon  = require( 'sinon' );


var node, parent, root;


describe( "Node", function(){



  describe( "local matrix", function(){

    beforeEach(function(){
      node = new Node();
    })

    it( "should have correct position", function(){

      node.position[0] = 10;
      node.position[1] = 11;
      node.position[2] = 12;

      node.invalidate();
      node.updateMatrix();

      equalish( node._matrix, [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          10, 11, 12, 1
      ]);

    });

    it( "should have correct rotation", function(){
      var rad = Math.PI/2;
      glmat.quat.rotateX( node.rotation, node.rotation, rad )

      node.invalidate();
      node.updateMatrix();

      equalish( node._matrix, [
          1, 0, 0, 0,
          0, Math.cos(rad), Math.sin(rad), 0,
          0, -Math.sin(rad), Math.cos(rad), 0,
          0, 0, 0, 1
      ]);

    });


    it( "should have correct scale", function(){
      var rad = Math.PI/2;

      node.scale[0] = 2.1;
      node.scale[1] = 2.2;
      node.scale[2] = 2.3;

      node.invalidate();
      node.updateMatrix();

      equalish( node._matrix, [
          2.1, 0, 0, 0,
          0, 2.2, 0, 0,
          0, 0, 2.3, 0,
          0, 0, 0, 1
      ]);

    });


    it( "should have correct combined", function(){
      var rad = Math.PI/2;

      node.position[0] = 10;
      node.position[1] = 11;
      node.position[2] = 12;

      var rad = Math.PI/2;
      glmat.quat.rotateX( node.rotation, node.rotation, rad )

      node.scale[0] = 2.1;
      node.scale[1] = 2.2;
      node.scale[2] = 2.3;

      node.invalidate();
      node.updateMatrix();

      equalish( node._matrix, [
          2.1, 0, 0, 0,
          0, 2.2*Math.cos(rad), 2.2*Math.sin(rad), 0,
          0, 2.3*-Math.sin(rad), 2.3*Math.cos(rad), 0,
          10, 11, 12, 1
      ]);

    });


  });





  describe( "position setters", function(){

    beforeEach(function(){
      node = new Node();

      node.x = 1;
      node.y = 2;
      node.z = 3;
    })


    it( "should set x", function(){
      expect( node.position[0] ).to.be( 1 );
    });
    it( "should set y", function(){
      expect( node.position[1] ).to.be( 2 );
    });
    it( "should set z", function(){
      expect( node.position[2] ).to.be( 3 );
    });
    it( "should get x", function(){
      expect( node.x ).to.be( 1 );
    });
    it( "should get y", function(){
      expect( node.y ).to.be( 2 );
    });
    it( "should get z", function(){
      expect( node.z ).to.be( 3 );
    });


    it( "should invalidate", function(){
      node.updateMatrix()
      expect( node._matrix[14] ).to.be( 3 );
    });

  });



  describe( "setMatrix", function(){
    var testMat = [
        .2, 0,  0, 0,
        0, 0, -.3, 0,
        0, .4,  0, 0,
        2, 4,  8, 1
      ];


    beforeEach(function(){
      node = new Node();
      node.updateWorldMatrix();


      node.setMatrix( testMat );
    })


    it( "should set rotation", function(){
      var out = glmat.quat.create()
      matr = [ .2, 0,  0,
               0,  0, -.3,
               0, .4,  0 ];

      equalish(glmat.vec3.transformQuat([], [0,1,0], node.rotation), [0,0,-1] );

      equalish( node.rotation, [-0.707106, 0, 0, 0.707106] );
    });

    it( "should set position", function(){
      equalish( node.position, [2, 4, 8] );
    });

    it( "should set scale", function(){
      equalish( node.scale, [.2, .3, .4] );
    });

    it( "should update to original matrix", function(){
      node.invalidate()
      node.updateMatrix()
      equalish( node._matrix, testMat);
    });

    it( "should invalidate world matrix", function(){
      node.updateWorldMatrix()
      equalish( node._wmatrix, testMat);
    });

  });





  describe( "nesting", function(){

    beforeEach(function(){
      node = new Node();
      parent = new Node()
      parent.add( node )
    })


    it( "should set _parent", function(){
      expect( node._parent ).to.be( parent )
    });


    it( "should set _children", function(){
      expect( parent._children.length ).to.be( 1 )
      expect( parent._children[0] ).to.be( node )
    });


    it( "duplicate add should prevent dup in _children", function(){
      parent.add( node )
      expect( parent._children.length ).to.be( 1 )
      expect( parent._children[0] ).to.be( node )
    });


    it( "remove should unset _parent", function(){
      parent.remove( node )
      expect( node._parent ).to.be( null )
    });


    it( "remove should unset _children", function(){
      parent.remove( node )
      expect( parent._children.length ).to.be( 0 )
    });

    describe( "and reparenting", function(){

      var newParent;

      beforeEach(function(){
        node.updateWorldMatrix()
        newParent = new Node();
        newParent.add( node )
        newParent.x = 10;
      })


      it( "should remove child from old parent", function(){
        expect( parent._children.length ).to.be( 0 )
      });

      it( "should add child to new parent", function(){
        expect( newParent._children.length ).to.be( 1 )
        expect( newParent._children[0] ).to.be( node )
      });

      it( "should invalidate world matrix", function(){
        node.updateWorldMatrix()
        expect( node._wmatrix[12] ).to.be( 10 )
      });

    });



  });






  describe( "world matrix", function(){

    var testMat = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      2, 5, 0, 1
    ]

    beforeEach(function(){
      node = new Node();
      parent = new Node()
      root = new Node()
      parent.add( node )
      root.add( parent )

      node.position[0]   = 1
      parent.position[0] = 1
      root.position[1] = 5

      node.invalidate();
      parent.invalidate();

    })

    it( "update root should update descendants", function(){
      root.updateWorldMatrix()

      equalish( node._wmatrix, testMat);
    });


    it( "update children should update parents", function(){
      node.updateWorldMatrix()

      equalish( parent._wmatrix, [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          1, 5, 0, 1
      ]);
    });

    it( "update children should update children", function(){
      node.updateWorldMatrix()

      equalish( node._wmatrix, testMat);

    });


    it( "invalidate middle should update children", function(){
      root.updateWorldMatrix()

      parent.position[0] = 3
      parent.invalidate()

      root.updateWorldMatrix()

      equalish( node._wmatrix, [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          4, 5, 0, 1
      ]);

    });

    it( "invalidate root should update children", function(){
      node.updateWorldMatrix()

      root.position[1] = -5
      root.invalidate()

      node.updateWorldMatrix()

      equalish( node._wmatrix, [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          2, -5, 0, 1
      ]);

    });

    it( "invalidate parent should update children", function(){
      node.updateWorldMatrix()

      parent.position[0] = -4
      parent.invalidate()

      node.updateWorldMatrix()

      equalish( node._wmatrix, [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          -3, 5, 0, 1
      ]);

    });


    it( "invalidate children should update children", function(){

      root.updateWorldMatrix()

      node.position[0] = -3
      node.invalidate()

      root.updateWorldMatrix()

      equalish( node._wmatrix, [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          -2, 5, 0, 1
      ]);

    });


    it( "update valid children should not recompute parents", function(){
      node.updateWorldMatrix()

      var compute = sinon.spy( Node.prototype, "_computeWorldMatrix" );
      var tinvalid = sinon.spy( Node.prototype, "_hasInvalidWorldMatrix" );

      node.updateWorldMatrix()

      compute.restore();
      tinvalid.restore();

      expect( compute.callCount ).to.be( 0 )
      expect( tinvalid.callCount ).to.be( 3 )

    });



    it( "update valid root should not recompute parents", function(){
      root.updateWorldMatrix()

      var compute = sinon.spy( glmat.mat4, "multiply" );

      root.updateWorldMatrix()
      compute.restore()
      expect( compute.callCount ).to.be( 0 )

    });



    it( "minimize invalid chain check", function(){

      var tinvalid = sinon.spy( Node.prototype, "_hasInvalidWorldMatrix" );
      root.updateWorldMatrix()
      tinvalid.restore();

      // console.log( tinvalid.callCount );
      expect( tinvalid.callCount ).to.be( 3 )


    });


  });




});
